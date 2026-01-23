import asyncio
import concurrent.futures
import logging
import math
import os
import re
import select
import subprocess
import tempfile
import zipfile
from enum import Enum
from pathlib import Path
from pprint import pprint
from typing import Annotated, Dict, Iterable, List, Literal, Tuple

import aiofiles
import aiohttp
import boto3
import geopandas as gpd
import typer
from dotenv import dotenv_values
from osgeo import gdal
from pydantic import BaseModel
from tqdm import tqdm
from tqdm.contrib.logging import logging_redirect_tqdm

app = typer.Typer()


ADMIN_LEVELS = ["ADM0"]
BASE_ZOOM_VALUE = 0.5 * math.log2(20000000) + 9
BUILDINGS_LAYER = "buildings"
BUILDINGS_ZOOM = 4
MAX_ZOOM = 17


class Verbose(Enum):
    Error = logging.ERROR
    Warning = logging.WARNING
    Info = logging.INFO
    Debug = logging.DEBUG

    @classmethod
    def from_int(cls, verbose_int: int):
        match verbose_int:
            case 0:
                return cls.Error
            case 1:
                return cls.Warning
            case 2:
                return cls.Info
            case 3:
                return cls.Debug
            case _:
                raise RuntimeError("Verbose has only 4 possible values.")


def setup_logging(verbose: Verbose):
    logging.basicConfig(
        level=verbose.value,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )
    return verbose != Verbose.Error


def _safe_name(code: str) -> str:
    """Return a filesystem-safe version of a country code."""
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in code)


async def _get_content_length(session: aiohttp.ClientSession, url: str) -> int:
    """Issue a HEAD request to fetch the Content-Length header."""
    async with session.head(url, allow_redirects=True) as resp:
        resp.raise_for_status()
        return int(resp.headers.get("Content-Length", 0))


class AdminInfo(BaseModel):
    geojson_path: Path
    pmtiles_path: Path | None = None
    mean_area: float

    def get_pmtiles_path(self):
        if self.pmtiles_path is None:
            raise RuntimeError("pmtiles_path was not specified.")
        return self.pmtiles_path


class CountryAdminInfo(BaseModel):
    levels: Dict[str, AdminInfo]


class BuildingsInfo(BaseModel):
    gpkg_zip_path: Path
    gpkg_path: Path | None = None
    fgb_path: Path | None = None
    pmtiles_path: Path | None = None

    def get_gpkg_path(self):
        if self.gpkg_path is None:
            raise RuntimeError("gpkg_path was not specified.")
        return self.gpkg_path

    def get_fgb_path(self):
        if self.fgb_path is None:
            raise RuntimeError("fgb_path was not specified.")
        return self.fgb_path

    def get_pmtiles_path(self):
        if self.pmtiles_path is None:
            raise RuntimeError("pmtiles_path was not specified.")
        return self.pmtiles_path


class Country(BaseModel):
    admin_info: CountryAdminInfo
    bdgs_info: BuildingsInfo
    pmtiles_path: Path | None = None

    def get_pmtiles_path(self):
        if self.pmtiles_path is None:
            raise RuntimeError("pmtiles_path was not specified.")
        return self.pmtiles_path


async def download_admin_one_country_one_level(
    session: aiohttp.ClientSession,
    country_code: str,
    level: str,
    output_dir: Path,
    overwrite: bool,
    chunk_size: int = 64 * 1024,
) -> AdminInfo:
    """
    Perform a single GET request for a given country/administrative level,
    then save the GeoJSON file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    save_path = output_dir / f"{country_code}-{level}.geojson"
    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")

    else:
        meta_url = (
            f"https://www.geoboundaries.org/api/current/gbOpen/{country_code}/{level}"
        )

        try:
            async with session.get(meta_url) as resp:
                resp.raise_for_status()
                meta = await resp.json()
        except Exception as e:
            e.add_note(
                f"This probably means that the country code ({country_code}) or the administrative level ({level}) doesn't exist."
            )
            raise e

        geojson_url = meta.get("gjDownloadURL", None)

        if geojson_url is None:
            raise RuntimeError("No URL found to download!")

        # Download the actual boundaries
        async with session.get(geojson_url) as resp:
            resp.raise_for_status()
            total_bytes = int(resp.headers.get("Content-Length", 0))

            pbar = tqdm(
                total=total_bytes,
                unit="B",
                unit_scale=True,
                desc=f"{country_code}-{level}",
                colour="green",
                leave=True,
            )

            # Stream the response to disk in binary mode
            async with aiofiles.open(save_path, mode="wb") as f:
                async for chunk in resp.content.iter_chunked(chunk_size):
                    await f.write(chunk)
                    pbar.update(len(chunk))

            pbar.close()

    # Compute the mean area
    gdf = gpd.read_file(save_path)
    gdf = gdf.to_crs(3857)  # project to meters
    return AdminInfo(
        geojson_path=save_path,
        mean_area=float(gdf.geometry.area.mean()),
    )


async def download_admin_one_country(
    session: aiohttp.ClientSession, country_code: str, output_dir: Path, overwrite: bool
) -> CountryAdminInfo:
    """
    Fire off the three level-specific requests for a single country in parallel.
    """
    # Create a coroutine for each level and gather them
    admin_infos = await asyncio.gather(
        *(
            download_admin_one_country_one_level(
                session, country_code, lvl, output_dir, overwrite=overwrite
            )
            for lvl in ADMIN_LEVELS
        )
    )
    return CountryAdminInfo(levels=dict(zip(ADMIN_LEVELS, admin_infos)))


async def download_admin(
    country_codes: List[str], output_dir: Path, overwrite: bool = False
) -> dict[str, CountryAdminInfo]:
    """
    Entry point: open a single aiohttp session and run all country queries concurrently.
    """
    logging.info(f"Downloading the administrative boundaries...")
    download_timeout = aiohttp.ClientTimeout(total=None, sock_connect=10, sock_read=300)
    async with aiohttp.ClientSession(timeout=download_timeout) as session:
        # Run each country's set of requests concurrently as well
        areas_per_country = await asyncio.gather(
            *(
                download_admin_one_country(
                    session, code, output_dir, overwrite=overwrite
                )
                for code in country_codes
            )
        )

    logging.info(f"Done downloading the administrative boundaries.")
    return dict(zip(country_codes, areas_per_country))


async def get_buildings_country_codes_and_urls() -> Dict[str, str]:
    logging.info(f"Finding all buildings country codes and download links...")
    meta_url = "https://api.eubucco.com/v0.1/countries"

    meta_timeout = aiohttp.ClientTimeout(total=15)
    async with aiohttp.ClientSession(timeout=meta_timeout) as session:
        async with session.get(meta_url) as resp:
            resp.raise_for_status()
            meta = await resp.json()

    code_to_url: dict[str, str] = {}
    for country_meta in meta:
        gpkg_info = country_meta.get("gpkg")
        gpkg_name: str = gpkg_info.get("name")
        if "OTHER-LICENSE" in gpkg_name:
            continue
        country_code = gpkg_name.split("-")[1].split(".")[0]
        code_to_url[country_code] = gpkg_info.get("download_link")

    logging.info(f"Done finding all buildings country codes and download links.")
    return code_to_url


async def download_buildings_one_country(
    session: aiohttp.ClientSession,
    country_code: str,
    data_url: str,
    save_path: Path,
    overwrite: bool,
    chunk_size: int = 64 * 1024,
) -> None:
    """
    Perform a single GET request for a given country,
    then save the GeoPackage file.
    """
    save_path.parent.mkdir(parents=True, exist_ok=True)

    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")
        return

    try:
        async with session.get(data_url) as resp:
            resp.raise_for_status()

            total_bytes = int(resp.headers.get("Content-Length", 0))

            pbar = tqdm(
                total=total_bytes,
                unit="B",
                unit_scale=True,
                desc=f"{country_code}",
                colour="green",
            )

            # Stream the response to disk in binary mode
            async with aiofiles.open(save_path, mode="wb") as f:
                async for chunk in resp.content.iter_chunked(chunk_size):
                    await f.write(chunk)
                    pbar.update(len(chunk))

            pbar.close()

    except aiohttp.ClientError as e:
        raise RuntimeError(f"Failed to download {data_url}: {e}") from e


async def download_buildings(
    country_codes: List[str], output_dir: Path, overwrite: bool = False
) -> dict[str, BuildingsInfo]:
    logging.info(f"Downloading the buildings...")

    code_to_bdgs_info = {
        country_code: BuildingsInfo(
            gpkg_zip_path=output_dir / f"{country_code}.gpkg.zip"
        )
        for country_code in country_codes
    }
    country_codes_to_download: List[str] = []
    if overwrite:
        country_codes_to_download = country_codes
    else:
        for country_code, bdgs_info in code_to_bdgs_info.items():
            if not bdgs_info.gpkg_zip_path.exists():
                country_codes_to_download.append(country_code)

    if len(country_codes_to_download) == 0:
        logging.info(f"All buildings files were already downloaded.")
        return code_to_bdgs_info

    code_to_url = await get_buildings_country_codes_and_urls()

    logging.info(f"Downloading the buildings...")
    download_timeout = aiohttp.ClientTimeout(total=None, sock_connect=10, sock_read=300)
    async with aiohttp.ClientSession(timeout=download_timeout) as session:
        await asyncio.gather(
            *(
                download_buildings_one_country(
                    session,
                    code,
                    code_to_url[code],
                    code_to_bdgs_info[code].gpkg_zip_path,
                    overwrite=overwrite,
                )
                for code in country_codes_to_download
            )
        )

    logging.info(f"Done downloading the buildings.")
    return code_to_bdgs_info


# ----------------------------------------------------------------------
# Small wrapper to run a shell command and raise a clear exception on failure
# ----------------------------------------------------------------------
def _run_cmd(cmd: List[str]) -> subprocess.CompletedProcess:
    """Run a command synchronously, raising on non-zero exit."""
    logging.info(" ".join(cmd))
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Command {' '.join(cmd)} failed (code {result.returncode})\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )
    return result


def unzip_buildings_one_country(
    input_zip_path: Path, output_path: Path, overwrite: bool
):
    """
    Unzips the files
    """

    if output_path.exists() and not overwrite:
        logging.debug(
            f"The content of {input_zip_path} has already been extracted into {output_path}. Skipping extraction."
        )
        return output_path

    with zipfile.ZipFile(input_zip_path, "r") as zip_ref:
        # Get list of files that would be created (skip directories)
        files_to_extract = [
            member for member in zip_ref.namelist() if not member.endswith("/")
        ]

        if len(files_to_extract) != 1:
            raise RuntimeError(
                "Only one file is expected in the zipped GeoPackages of buildings."
            )
        file_to_extract = files_to_extract[0]

        # Create unique temp directory in same parent as output
        with tempfile.TemporaryDirectory(dir=output_path.parent) as temp_dir_str:
            logging.info(f"Extracting {input_zip_path} into {output_path}...")
            temp_dir = Path(temp_dir_str)

            # Extract to temp dir (preserves zip structure)
            zip_ref.extract(file_to_extract, temp_dir)

            # Find extracted file (handles zip path structure)
            extracted_file = next(temp_dir.rglob("*.gpkg"))

            # Atomic move to final destination
            extracted_file.rename(output_path)
            logging.info(f"Done extracting {input_zip_path} into {output_path}.")

        return output_path


def unzip_buildings(
    buildings_infos: dict[str, BuildingsInfo],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
):
    logging.info("Unzipping all zipped GeoPackage of buildings...")
    output_dir.mkdir(parents=True, exist_ok=True)

    tasks = [
        (
            buildings_info.gpkg_zip_path,
            output_dir / f"{country_code}.gpkg",
            overwrite,
        )
        for country_code, buildings_info in buildings_infos.items()
    ]

    with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(unzip_buildings_one_country, *tasks_separated)

        # Assign results to BuildingsInfo objects in correct order
        for country_code, result in zip(buildings_infos.keys(), results):
            buildings_infos[country_code].gpkg_path = result
            logging.debug(f"Set {country_code}.gpkg_path = {result}")

    logging.info("Done unzipping all zipped GeoPackage of buildings.")


def get_layers_from_gpkg(gpkg_path: Path) -> list[str]:
    """
    Return a list of layer names in the GeoPackage by parsing ogrinfo output.
    Assumes lines like: '1: layer_name (Point)'.
    """
    # cmd = ["ogrinfo", "-ro", str(gpkg_path)]
    # proc = _run_cmd(cmd)
    # layers = []
    # for line in proc.stdout.splitlines():
    #     line = line.strip()
    #     # Match "1: layername (..."
    #     if ":" in line:
    #         parts = line.split(":", 1)
    #         idx = parts[0].strip()
    #         # Ensure first part is an integer index
    #         if idx.isdigit():
    #             rest = parts[1].strip()
    #             if rest:
    #                 # layer name is first token, may be quoted
    #                 name = rest.split()[0].strip('"')
    #                 layers.append(name)

    ds = gdal.OpenEx(str(gpkg_path), gdal.OF_VECTOR)
    layers = [ds.GetLayer(i).GetName() for i in range(ds.GetLayerCount())]
    ds = None

    return layers


def merge_gpkg_layers(gpkg_path: Path):
    # gdal.DontUseExceptions()
    print(f"{gpkg_path = }")
    ds = gdal.OpenEx(str(gpkg_path), gdal.OF_VECTOR)
    layers = [ds.GetLayer(i).GetName() for i in range(ds.GetLayerCount())]
    ds = None

    if len(layers) == 1:
        return

    union_sql = f"SELECT * FROM '{layers[0]}' UNION ALL " + " UNION ALL ".join(
        f"SELECT * FROM '{name}'" for name in layers[1:]
    )

    # Temp output → atomic replace
    temp_path = gpkg_path.parent / f"{gpkg_path.name}.tmp"
    print(f"{temp_path = }")

    try:
        logging.info(f"Merging layers in {gpkg_path}...")
        final_layer = gpkg_path.stem
        gdal.VectorTranslate(
            str(temp_path),
            str(gpkg_path),
            options=gdal.VectorTranslateOptions(
                accessMode="overwrite",
                format="GPKG",
                SQLDialect="SQLite",
                SQLStatement=union_sql,
                layerName=final_layer,
            ),
        )

        # Atomic replace
        gpkg_path.unlink()
        temp_path.rename(gpkg_path)
        logging.info(f"Done merging layers in {gpkg_path}.")
        return

    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise RuntimeError(f"Merge failed: {e}")


def build_union_sql(layers: List[str]) -> str | None:
    """
    Build a SQLite UNION ALL SQL over all layers: SELECT * FROM l1 UNION ALL SELECT * FROM l2 ...
    """
    if len(layers) == 0:
        raise ValueError("No layers given to build UNION SQL")
    elif len(layers) == 1:
        # return []
        return None

    parts = []
    for i, layer in enumerate(layers):
        sel = f"SELECT * FROM '{layer}'"
        if i == 0:
            parts.append(sel)
        else:
            parts.append("UNION ALL " + sel)
    # return ["-dialect", "SQLite", "-sql", f"{" ".join(parts)}"]
    return f"{" ".join(parts)}"


def convert_one_to_flatgeobuf(
    buildings_info: BuildingsInfo,
    output_dir: Path,
    overwrite: bool,
    position: int | None = None,
) -> Tuple[Path, bool]:
    """
    Convert a single <country_code>.gpkg → <country_code>.fgb using ogr2ogr.
    """
    input_path = buildings_info.get_gpkg_path()
    save_path = (
        output_dir
        / f"{str(input_path.name).removesuffix("".join(input_path.suffixes))}.fgb"
    )

    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")
        return save_path, True

    gpkg_layers = get_layers_from_gpkg(input_path)
    union_sql = build_union_sql(gpkg_layers)
    # merge_gpkg_layers(gpkg_path=input_path)

    pbar = tqdm(
        total=100,
        unit="%",
        desc=f"{save_path.stem}",
        colour="yellow",
        leave=True,
        position=position,
        bar_format="{desc}: {percentage:3.0f}%|{bar}| [{elapsed}<{remaining}, {rate_fmt}{postfix}]",
    )

    def _callback_func(complete, message, data: tqdm):
        data.update(complete * 100 - data.n)

    SQLDialect = None if union_sql is None else "SQLite"
    callback = _callback_func if union_sql is None else None
    callback_data = pbar if union_sql is None else None

    gdal.VectorTranslate(
        save_path,
        input_path,
        options=gdal.VectorTranslateOptions(
            format="FlatGeoBuf",
            dstSRS="EPSG:4326",
            SQLDialect=SQLDialect,
            SQLStatement=union_sql,
            callback=callback,
            callback_data=callback_data,
        ),
    )
    pbar.n = 100
    pbar.refresh()
    pbar.close()

    logging.debug(f"Done converting {input_path} to {save_path}.")

    return save_path, True


def convert_to_flatgeobufs(
    buildings_infos: dict[str, BuildingsInfo],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
) -> List[Tuple[Path, bool]]:
    """
    Convert every <country_code>.gpkg → <country_code>.fgb using ogr2ogr.
    Returns a list of (output_path, success) tuples.
    """
    logging.info("Converting all GeoPackage to FlatGeoBuf...")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )

    tasks = [
        (buildings_info, output_dir, overwrite, i)
        for i, (country_code, buildings_info) in enumerate(buildings_infos.items())
    ]

    with concurrent.futures.ProcessPoolExecutor(
        max_workers=workers,
        initializer=tqdm.set_lock,
        initargs=(tqdm.get_lock(),),
    ) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(convert_one_to_flatgeobuf, *tasks_separated)

        # Assign results to BuildingsInfo objects in correct order
        for country_code, result in zip(buildings_infos.keys(), results):
            buildings_infos[country_code].fgb_path = result[0]
            logging.debug(
                f"Converted {buildings_infos[country_code].gpkg_path} to {buildings_infos[country_code].fgb_path}."
            )

    logging.info("Done converting all GeoPackage to FlatGeoBuf.")
    return list(results)


def _run_cmd_with_progress(
    cmd: list[str], desc: str = "tippecanoe", position: int | None = None
) -> subprocess.CompletedProcess:
    """Run tippecanoe with live tqdm progress from stderr."""
    logging.info(" ".join(cmd))

    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=0,  # Line buffering
        universal_newlines=True,
    )

    progress_re = re.compile(r"(\d+(?:\.\d+)?)%\s+\d+/\d+/\d+")  # "27.7% 5/19/12"
    pbar = tqdm(
        total=100,
        unit="%",
        desc=desc,
        colour="blue",
        leave=True,
        position=position,
    )

    stdout_out, stderr_out = [], []

    while p.poll() is None:
        ready_r, _, _ = select.select([p.stdout, p.stderr], [], [], 0.1)

        for stream in ready_r:
            line = stream.readline()
            if not line:
                continue

            if stream == p.stderr:
                match = progress_re.search(line)
                if match:
                    pct = float(match.group(1))
                    pbar.n = min(pct, 100)
                    pbar.refresh()
                else:
                    stderr_out.append(line)
            else:
                stdout_out.append(line)

    # Drain remaining output
    stdout_out.extend(p.stdout.readlines())
    stderr_out.extend(p.stderr.readlines())

    pbar.n = 100
    pbar.refresh()
    pbar.close()
    stdout = "".join(stdout_out)
    stderr = "".join(stderr_out)

    if p.returncode != 0:
        raise RuntimeError(
            f"Command {' '.join(cmd)} failed (code {p.returncode})\n"
            f"stdout: {stdout}\nstderr: {''.join(stderr_out)}"
        )

    return subprocess.CompletedProcess(p.args, p.returncode, stdout, stderr)


def convert_files_to_one_pmtiles(
    input_paths: List[Path],
    save_path: Path,
    min_zoom: int,
    max_zoom: int | Literal["g"],
    layer: str,
    overwrite: bool,
    pbar_desc: str,
    position: int,
) -> Path:
    """
    Convert a single <country>.fgb → <country>.pmtiles using the gdal_translate CLI.
    Returns (output_fgb_path, success_flag).
    """
    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")
        return save_path

    input_paths_str = list(map(lambda p: str(p), input_paths))

    translate_cmd = [
        "tippecanoe",
        f"-Z{min_zoom}",
        f"-z{max_zoom}",
        "-o",
        str(save_path),
        "-l",
        layer,
        # "--coalesce-densest-as-needed",
        # "--drop-smallest-as-needed",
        "--drop-densest-as-needed",
        "--include=height",
        "--include=age",
        "--include=type",
        "--simplification=10",
        "--no-feature-limit",
        f"-M {1_500_000}",
        *input_paths_str,
    ]

    if max_zoom == "g":
        translate_cmd.append("--extend-zooms-if-still-dropping")
    _run_cmd_with_progress(translate_cmd, desc=pbar_desc, position=position)
    logging.debug(f"Done converting {",".join(input_paths_str)} to {save_path}.")

    return save_path


def convert_to_pmtiles(
    countries_infos: dict[str, Country],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
) -> List[Path]:
    """
    Convert every *.fgb in *fgb_files* to PMTiles using a process pool.
    Returns a list of (output_path, success) tuples.
    """
    logging.info("Converting all FlatGeoBuf to PMTiles...")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )
    logging.info(f"Using {workers} workers.")

    # tasks = []
    # tasks_info: list[tuple[str, str]] = []  # info to gather results properly

    # for country_code, country_infos in countries_infos.items():
    #     bdgs_info = country_infos.bdgs_info
    #     country_admin_info = country_infos.admin_info

    #     start_zooms: List[int] = [0]

    #     # Administrative boundaries
    #     # Compute the optimal min zoom for each admin level
    #     for admin_level in ADMIN_LEVELS[1:]:

    #         admin_info = country_admin_info.levels[admin_level]
    #         start_zoom = math.ceil(
    #             BASE_ZOOM_VALUE - 0.5 * math.log2(admin_info.mean_area)
    #         )
    #         # Make sure the start zoom is higher that the previous one
    #         if start_zoom <= start_zooms[-1]:
    #             start_zoom = start_zooms[-1] + 1
    #         start_zooms.append(start_zoom)

    #     # Keep only the levels that fit before the building zoom
    #     zooms: List[Tuple[int, int]] = []
    #     for i in range(len(start_zooms)):
    #         min_zoom = start_zooms[i]
    #         if i + 1 < len(start_zooms):
    #             max_zoom = min(BUILDINGS_ZOOM - 1, start_zooms[i + 1])
    #         else:
    #             max_zoom = BUILDINGS_ZOOM - 1
    #         if min_zoom > max_zoom:
    #             break
    #         zooms.append((min_zoom, max_zoom))

    #     for i, (min_zoom, max_zoom) in enumerate(zooms):
    #         admin_level = ADMIN_LEVELS[i]
    #         admin_info = country_admin_info.levels[admin_level]
    #         tasks.append(
    #             (
    #                 admin_info.geojson_path,
    #                 min_zoom,
    #                 max_zoom,
    #                 output_dir,
    #                 admin_level,
    #                 overwrite,
    #                 f"Admin {country_code}",
    #                 len(tasks),
    #             )
    #         )
    #         tasks_info.append((country_code, admin_level))

    #     # Buildings
    #     min_zoom = zooms[-1][1] + 1
    #     if min_zoom != BUILDINGS_ZOOM:
    #         raise RuntimeError(
    #             f"The zoom assigned to buildings ({min_zoom}) is different from the expected BUILDINGS_ZOOM ({BUILDINGS_ZOOM})."
    #         )
    #     tasks.append(
    #         (
    #             bdgs_info.get_fgb_path(),
    #             min_zoom,
    #             MAX_ZOOM,
    #             output_dir,
    #             BUILDINGS_LAYER,
    #             overwrite,
    #             f"Buildings {country_code}",
    #             len(tasks),
    #         )
    #     )
    #     tasks_info.append((country_code, BUILDINGS_LAYER))

    admin_paths: List[Path] = []
    bdgs_paths: List[Path] = []

    for country_code, country_infos in countries_infos.items():
        bdgs_info = country_infos.bdgs_info
        admin_info = country_infos.admin_info.levels["ADM0"]

        admin_paths.append(admin_info.geojson_path)
        bdgs_paths.append(bdgs_info.get_fgb_path())

    tasks = [
        (
            admin_paths,
            output_dir / "admin.pmtiles",
            0,
            BUILDINGS_ZOOM - 1,
            "ADM0",
            overwrite,
            "Admin",
            0,
        ),
        (
            bdgs_paths,
            output_dir / "buildings.pmtiles",
            BUILDINGS_ZOOM,
            MAX_ZOOM,
            BUILDINGS_LAYER,
            overwrite,
            "Buildings",
            1,
        ),
    ]

    final_paths: List[Path] = []
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=workers,
        initializer=tqdm.set_lock,
        initargs=(tqdm.get_lock(),),
    ) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(convert_files_to_one_pmtiles, *tasks_separated)

        for result in results:
            final_paths.append(result)

        # # Assign results to BuildingsInfo objects in correct order
        # for (country_code, layer), result in zip(tasks_info, results):
        #     pmtiles_path, ok = result

        #     # Find the originating object and store the path
        #     if layer in ADMIN_LEVELS:
        #         countries_infos[country_code].admin_info.levels[
        #             layer
        #         ].pmtiles_path = pmtiles_path
        #     elif layer == "buildings":
        #         countries_infos[country_code].bdgs_info.pmtiles_path = pmtiles_path

    logging.info("Done converting all FlatGeoBuf to PMTiles.")
    return final_paths


def join_one_pmtiles(
    input_paths: List[Path],
    save_path: Path,
    overwrite: bool,
) -> Tuple[Path, bool]:
    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")

    else:
        try:
            translate_cmd = [
                "tile-join",
                "-o",
                str(save_path),
                *map(lambda p: str(p), input_paths),
                "--no-tile-size-limit",
            ]

            _run_cmd(translate_cmd)
            logging.debug(
                f"Done joining {", ".join(map(lambda p: str(p), input_paths))} to {save_path}."
            )

        except Exception as exc:
            logging.error(f"Creating {save_path.name} → {exc}")
            return save_path, False

    return save_path, True


def join_pmtiles_per_country(
    countries_infos: dict[str, Country],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
) -> List[Tuple[Path, bool]]:
    logging.info("Joining all PMTiles per country...")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )
    logging.info(f"Using {workers} workers.")

    tasks: List[Tuple[List[Path], Path, bool]] = []

    for country_code, country_infos in countries_infos.items():
        bdgs_info = country_infos.bdgs_info
        country_admin_info = country_infos.admin_info

        input_paths: List[Path] = []
        input_paths.append(bdgs_info.get_pmtiles_path())
        # Administrative boundaries
        for admin_level in ADMIN_LEVELS:
            admin_info = country_admin_info.levels[admin_level]

            # Ignore the administrative levels that were skipped
            if admin_info.pmtiles_path is None:
                continue
            input_paths.append(admin_info.get_pmtiles_path())

        save_path = output_dir / f"{country_code}.pmtiles"
        tasks.append(
            (
                input_paths,
                save_path,
                overwrite,
            )
        )

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(join_one_pmtiles, *tasks_separated)

        # Assign results to BuildingsInfo objects in correct order
        for country_code, result in zip(countries_infos.keys(), results):
            pmtiles_path, ok = result
            countries_infos[country_code].pmtiles_path = pmtiles_path

    logging.info("Done joining all PMTiles per country.")
    return list(results)


def join_pmtiles_all_countries(
    countries_infos: dict[str, Country], save_path: Path, overwrite: bool = False
):
    logging.info("Joining the PMTiles of all countries together...")
    if save_path.exists() and not overwrite:
        logging.debug(f"Skipping {save_path} which already exists.")

    else:
        try:
            translate_cmd = [
                "tile-join",
                "-o",
                str(save_path),
                *map(lambda p: str(p.pmtiles_path), countries_infos.values()),
                "--no-tile-size-limit",
            ]

            _run_cmd(translate_cmd)

        except Exception as exc:
            logging.error(f"Creating {save_path.name} → {exc}")
            return save_path, False

    logging.info("Done joining the PMTiles of all countries together.")


@app.command("push_pmtiles")
def push_pmtiles(
    local_path: Annotated[
        Path,
        typer.Option(
            "-l", "--local_path", help="Local path of the file to push.", exists=True
        ),
    ],
    s3_path: Annotated[
        str,
        typer.Option(
            "-s",
            "--s3_path",
            help="S3 storage path of the file to push (from the root of the S3 bucket).",
        ),
    ],
):
    logging.info("Pushing the PMTiles to S3 storage...")
    S3_ENDPOINT = "https://fsn1.your-objectstorage.com"
    S3_BUCKET = "eubuccodissemination"

    config = dotenv_values(".env")

    client = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=config["ACCESS_KEY"],
        aws_secret_access_key=config["SECRET_KEY"],
    )

    response = client.upload_file(local_path, S3_BUCKET, s3_path)
    logging.info("Done pushing the PMTiles to S3 storage.")


@app.command("run_all")
def make_pmtiles(
    data_dir: Annotated[
        Path,
        typer.Option(
            "-d", "--data_dir", help="Main directory of the data.", exists=True
        ),
    ],
    country_codes: Annotated[
        List[str],
        typer.Option(
            "-c",
            "--country_code",
            help="Codes of the countries to process.",
        ),
    ] = [],
    negative_country_codes: Annotated[
        List[str],
        typer.Option(
            "-n",
            "--not_country_code",
            help="Codes of the countries to not process.",
        ),
    ] = [],
    max_workers: Annotated[
        int | None, typer.Option("-j", help="Max number of workers to use.")
    ] = None,
    verbose_int: Annotated[int, typer.Option("--verbose", "-v", count=True)] = 0,
):
    setup_logging(verbose=Verbose.from_int(verbose_int))

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )
    gdal.DontUseExceptions()
    gdal.PushErrorHandler("CPLQuietErrorHandler")

    with logging_redirect_tqdm():
        # Get all the country codes
        if len(country_codes) == 0:
            country_codes_set = set(
                asyncio.run(get_buildings_country_codes_and_urls()).keys()
            )
        else:
            country_codes_set = set(country_codes)

        for negative_country_code in negative_country_codes:
            country_codes_set.remove(negative_country_code)

        country_codes = list(country_codes_set)

        # Download the administrative boundaries
        admin_dir = data_dir / "admin_boundaries"
        countries_admin_infos = asyncio.run(
            download_admin(country_codes, admin_dir, overwrite=False)
        )

        # Download the buildings
        bdgs_gpkg_zip_dir = data_dir / "buildings" / "gpkg_zip"
        bdgs_info = asyncio.run(
            download_buildings(country_codes, bdgs_gpkg_zip_dir, overwrite=False)
        )

        # Unzip the buildings
        bdgs_gpkg_dir = data_dir / "buildings" / "gpkg"
        unzip_buildings(
            buildings_infos=bdgs_info,
            output_dir=bdgs_gpkg_dir,
            max_workers=workers,
            overwrite=False,
        )

        # Convert the buildings to FlatGeoBuf
        buildings_flatgeobuf_dir = data_dir / "buildings" / "flatgeobuf"
        results = convert_to_flatgeobufs(
            buildings_infos=bdgs_info,
            output_dir=buildings_flatgeobuf_dir,
            max_workers=workers,
            overwrite=False,
        )

        countries_infos = {}
        for code in country_codes:
            countries_infos[code] = Country(
                admin_info=countries_admin_infos[code], bdgs_info=bdgs_info[code]
            )

        # Convert everything to individual PMTiles
        # individual_pmtiles_dir = data_dir / "pmtiles" / "indiv"
        pmtiles_indiv_dir = data_dir / "pmtiles" / "indiv"
        pmtiles_indiv_paths = convert_to_pmtiles(
            countries_infos=countries_infos,
            output_dir=pmtiles_indiv_dir,
            max_workers=workers,
            overwrite=False,
        )

        final_pmtiles_path = data_dir / "pmtiles" / "all.pmtiles"
        join_one_pmtiles(
            input_paths=pmtiles_indiv_paths,
            save_path=final_pmtiles_path,
            overwrite=False,
        )

        logging.info(f"Final PMTiles available at '{final_pmtiles_path}'.")

        # # Join everything in each country into one PMTiles
        # country_pmtiles_dir = data_dir / "pmtiles" / "country"
        # results = join_pmtiles_per_country(
        #     countries_infos=countries_infos,
        #     output_dir=country_pmtiles_dir,
        #     max_workers=workers,
        #     overwrite=False,
        # )

        # # Join the PMTiles of all countries together
        # final_pmtiles_path = data_dir / "pmtiles" / "all_countries.pmtiles"
        # results = join_pmtiles_all_countries(
        #     countries_infos=countries_infos,
        #     save_path=final_pmtiles_path,
        #     overwrite=False,
        # )


if __name__ == "__main__":
    app()

# Look at displaying the progress of the subprocesses
