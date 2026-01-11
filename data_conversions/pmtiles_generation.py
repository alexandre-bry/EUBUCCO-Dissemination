import asyncio
import concurrent.futures
import json
import logging
import math
import os
import subprocess
from enum import Enum
from pathlib import Path
from pprint import pprint
from typing import Dict, Iterable, List, Literal, Tuple

import aiofiles
import aiohttp
import boto3
import geopandas as gpd
from botocore.exceptions import ClientError, EndpointConnectionError
from dotenv import dotenv_values
from pydantic import BaseModel
from tqdm import tqdm
from tqdm.contrib.logging import logging_redirect_tqdm

ADMIN_LEVELS = ["ADM0", "ADM1", "ADM2"]
BASE_ZOOM_VALUE = 0.5 * math.log2(20000000) + 9
BUILDINGS_LAYER = "buildings"
MAX_ZOOM = 17


class Verbose(Enum):
    Error = logging.ERROR
    Warning = logging.WARNING
    Info = logging.INFO
    Debug = logging.DEBUG


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
    fgb_path: Path | None = None
    pmtiles_path: Path | None = None

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
        logging.info(f"Skipping {save_path} which already exists...")

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
    output_dir: Path,
    overwrite: bool,
    chunk_size: int = 64 * 1024,
) -> BuildingsInfo:
    """
    Perform a single GET request for a given country,
    then save the GeoPackage file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    safe_code = _safe_name(country_code)
    save_path = output_dir / f"{safe_code}.gpkg.zip"

    if save_path.exists() and not overwrite:
        logging.info(f"Skipping {save_path} which already exists...")

    else:
        try:
            async with session.get(data_url) as resp:
                resp.raise_for_status()

                total_bytes = int(resp.headers.get("Content-Length", 0))

                pbar = tqdm(
                    total=total_bytes,
                    unit="B",
                    unit_scale=True,
                    desc=f"{safe_code}",
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

    return BuildingsInfo(gpkg_zip_path=save_path)


async def download_buildings(
    country_codes: List[str], output_dir: Path, overwrite: bool = False
) -> dict[str, BuildingsInfo]:
    logging.info(f"Downloading the buildings...")
    code_to_url = await get_buildings_country_codes_and_urls()
    code_to_url = {
        code: url for (code, url) in code_to_url.items() if code in country_codes
    }

    logging.info(f"Downloading the buildings...")
    download_timeout = aiohttp.ClientTimeout(total=None, sock_connect=10, sock_read=300)
    async with aiohttp.ClientSession(timeout=download_timeout) as session:
        save_paths = await asyncio.gather(
            *(
                download_buildings_one_country(
                    session, code, url, output_dir, overwrite=overwrite
                )
                for (code, url) in code_to_url.items()
            )
        )

    logging.info(f"Done downloading the buildings.")
    return dict(zip(country_codes, save_paths))


# ----------------------------------------------------------------------
# Small wrapper to run a shell command and raise a clear exception on failure
# ----------------------------------------------------------------------
def _run_cmd(cmd: List[str]) -> None:
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


def convert_one_to_flatgeobuf(
    buildings_info: BuildingsInfo, output_dir: Path, overwrite: bool
) -> Tuple[Path, bool]:
    """
    Convert a single <country>.gpkg.zip → <country>.fgb using the gdal_translate CLI.
    Returns (output_fgb_path, success_flag).
    """
    input_path = buildings_info.gpkg_zip_path
    save_path = (
        output_dir
        / f"{str(input_path.name).removesuffix("".join(input_path.suffixes))}.fgb"
    )

    if save_path.exists() and not overwrite:
        logging.info(f"Skipping {save_path} which already exists...")

    else:
        try:
            translate_cmd = [
                "ogr2ogr",
                "-progress",
                "-f",
                "FlatGeoBuf",
                str(save_path),
                str(input_path),
                "-t_srs",
                "EPSG:4326",
            ]
            _run_cmd(translate_cmd)

        except Exception as exc:
            logging.error(f"{input_path.name} → {exc}")
            return save_path, False

    return save_path, True


def convert_to_flatgeobufs(
    buildings_infos: dict[str, BuildingsInfo],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
) -> List[Tuple[Path, bool]]:
    """
    Convert every *.gpkg.zip in *gpkg_zip_files* to FlatGeobuf using a process pool.
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

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        futures: list[concurrent.futures.Future[Tuple[Path, bool]]] = []

        for country_code, buildings_info in buildings_infos.items():
            futures.append(
                pool.submit(
                    convert_one_to_flatgeobuf,
                    buildings_info,
                    output_dir,
                    overwrite,
                )
            )

        results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Store the path of FlatGeoBuf
        for country_code, result in zip(buildings_infos.keys(), results):
            buildings_infos[country_code].fgb_path = result[0]

    logging.info("Done converting all GeoPackage to FlatGeoBuf.")
    return results


def convert_one_to_pmtiles(
    input_path: Path,
    min_zoom: int,
    max_zoom: int | Literal["g"],
    output_dir: Path,
    layer: str,
    overwrite: bool,
) -> Tuple[Path, bool]:
    """
    Convert a single <country>.fgb → <country>.pmtiles using the gdal_translate CLI.
    Returns (output_fgb_path, success_flag).
    """
    save_path = (
        output_dir
        / f"{str(input_path.name).removesuffix("".join(input_path.suffixes))}.pmtiles"
    )

    if save_path.exists() and not overwrite:
        logging.info(f"Skipping {save_path} which already exists...")

    else:
        try:
            translate_cmd = [
                "tippecanoe",
                f"-Z{min_zoom}",
                f"-z{max_zoom}",
                "-o",
                str(save_path),
                "-l",
                layer,
                "--coalesce-densest-as-needed",
                str(input_path),
            ]

            if max_zoom == "g":
                translate_cmd.append("--extend-zooms-if-still-dropping")
            _run_cmd(translate_cmd)

        except Exception as exc:
            logging.error(f"{input_path.name} → {exc}")
            return save_path, False

    return save_path, True


def convert_to_pmtiles(
    countries_infos: dict[str, Country],
    output_dir: Path,
    max_workers: int | None = None,
    overwrite: bool = False,
) -> List[Tuple[Path, bool]]:
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

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        futures: list[concurrent.futures.Future[Tuple[Path, bool]]] = []
        futures_info: list[tuple[str, str]] = []  # info the gather results properly
        for country_code, country_infos in countries_infos.items():
            bdgs_info = country_infos.bdgs_info
            country_admin_info = country_infos.admin_info

            zooms: List[Tuple[int, int]] = []
            prev_zoom = -1

            # Administrative boundaries
            for admin_level in ADMIN_LEVELS[1:]:

                admin_info = country_admin_info.levels[admin_level]
                zoom = math.ceil(
                    BASE_ZOOM_VALUE - 0.5 * math.log2(admin_info.mean_area)
                )
                if zoom <= 10:
                    zooms.append((prev_zoom + 1, zoom))
                    prev_zoom = zoom

            for i in range(len(zooms)):
                admin_level = ADMIN_LEVELS[i]
                admin_info = country_admin_info.levels[admin_level]
                min_zoom, max_zoom = zooms[i]
                futures.append(
                    pool.submit(
                        convert_one_to_pmtiles,
                        admin_info.geojson_path,
                        min_zoom,
                        max_zoom,
                        output_dir,
                        admin_level,
                        overwrite,
                    )
                )
                futures_info.append((country_code, admin_level))

            # Buildings
            min_zoom = zooms[-1][1] + 1
            futures.append(
                pool.submit(
                    convert_one_to_pmtiles,
                    bdgs_info.get_fgb_path(),
                    min_zoom,
                    MAX_ZOOM,
                    output_dir,
                    BUILDINGS_LAYER,
                    overwrite,
                )
            )
            futures_info.append((country_code, BUILDINGS_LAYER))

        results: List[Tuple[Path, bool]] = []
        for fut, (country_code, layer) in zip(
            concurrent.futures.as_completed(futures), futures_info
        ):
            pmtiles_path, ok = fut.result()
            results.append((pmtiles_path, ok))

            # Find the originating object and store the path
            if layer in ADMIN_LEVELS:
                countries_infos[country_code].admin_info.levels[
                    layer
                ].pmtiles_path = pmtiles_path
            elif layer == "buildings":
                countries_infos[country_code].bdgs_info.pmtiles_path = pmtiles_path

    logging.info("Done converting all FlatGeoBuf to PMTiles.")
    return results


def join_one_pmtiles(
    input_paths: List[Path],
    save_path: Path,
    overwrite: bool,
) -> Tuple[Path, bool]:
    if save_path.exists() and not overwrite:
        logging.info(f"Skipping {save_path} which already exists...")

    else:
        try:
            translate_cmd = [
                "tile-join",
                "-o",
                str(save_path),
                *map(lambda p: str(p), input_paths),
            ]

            _run_cmd(translate_cmd)

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

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        futures: list[concurrent.futures.Future[Tuple[Path, bool]]] = []
        futures_info: list[str] = []  # info the gather results properly
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
            futures.append(
                pool.submit(
                    join_one_pmtiles,
                    input_paths,
                    save_path,
                    overwrite,
                )
            )
            futures_info.append(country_code)

        results: List[Tuple[Path, bool]] = []
        for fut, country_code in zip(
            concurrent.futures.as_completed(futures), futures_info
        ):
            pmtiles_path, ok = fut.result()
            results.append((pmtiles_path, ok))
            countries_infos[country_code].pmtiles_path = pmtiles_path

    logging.info("Done joining all PMTiles per country.")
    return results


def join_pmtiles_all_countries(
    countries_infos: dict[str, Country], save_path: Path, overwrite: bool = False
):
    logging.info("Joining the PMTiles of all countries together...")
    if save_path.exists() and not overwrite:
        logging.info(f"Skipping {save_path} which already exists...")

    else:
        try:
            translate_cmd = [
                "tile-join",
                "-o",
                str(save_path),
                *map(lambda p: str(p.pmtiles_path), countries_infos.values()),
            ]

            _run_cmd(translate_cmd)

        except Exception as exc:
            logging.error(f"Creating {save_path.name} → {exc}")
            return save_path, False

    logging.info("Done joining the PMTiles of all countries together.")


def push_pmtiles(local_path: Path, s3_path: str):
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


if __name__ == "__main__":
    data_dir = Path("../data/")
    setup_logging(verbose=Verbose.Info)

    with logging_redirect_tqdm():
        # Get all the country codes
        country_codes = set(asyncio.run(get_buildings_country_codes_and_urls()).keys())
        country_codes.remove("CZE")  # Has multiple layers which makes the process crash
        country_codes = list(country_codes)

        # Download the administrative boundaries
        admin_dir = data_dir / "admin_boundaries"
        countries_admin_infos = asyncio.run(
            download_admin(country_codes, admin_dir, overwrite=False)
        )

        # Download the buildings
        bdgs_gpkg_dir = data_dir / "buildings" / "gpkg"
        bdgs_info = asyncio.run(
            download_buildings(country_codes, bdgs_gpkg_dir, overwrite=False)
        )

        # Convert the buildings to FlatGeoBuf
        buildings_flatgeobuf_dir = data_dir / "buildings" / "flatgeobuf"
        results = convert_to_flatgeobufs(
            buildings_infos=bdgs_info,
            output_dir=buildings_flatgeobuf_dir,
            overwrite=False,
        )

        successes = [p for p, ok in results if ok]
        failures = [p for p, ok in results if not ok]

        # print("\n=== Conversion summary ===")
        # print(f"✅ Successfully converted: {len(successes)}")
        # for p in successes:
        #     print(f"   • {p.name}")

        # if failures:
        #     print(f"\n❌ Failed conversions ({len(failures)}):")
        #     for p in failures:
        #         print(f"   • {p.name}")
        # else:
        #     print("\nAll files converted without error!")

        countries_infos = {}
        for code in country_codes:
            countries_infos[code] = Country(
                admin_info=countries_admin_infos[code], bdgs_info=bdgs_info[code]
            )

        # Convert everything to individual PMTiles
        individual_pmtiles_dir = data_dir / "pmtiles" / "indiv"
        results = convert_to_pmtiles(
            countries_infos=countries_infos,
            output_dir=individual_pmtiles_dir,
            overwrite=False,
        )

        # Join everything in each country into one PMTiles
        country_pmtiles_dir = data_dir / "pmtiles" / "country"
        results = join_pmtiles_per_country(
            countries_infos=countries_infos,
            output_dir=country_pmtiles_dir,
            overwrite=False,
        )

        # Join the PMTiles of all countries together
        final_pmtiles_path = data_dir / "pmtiles" / "all_countries.pmtiles"
        results = join_pmtiles_all_countries(
            countries_infos=countries_infos,
            save_path=final_pmtiles_path,
            overwrite=False,
        )

        # Push the file to the server
        push_pmtiles(local_path=final_pmtiles_path, s3_path="all_countries.pmtiles")

# Look at displaying the progress of the subprocesses
# Handle CZE with its multiple layers
