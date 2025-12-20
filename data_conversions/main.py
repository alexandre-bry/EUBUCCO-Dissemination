import time
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

import geopandas as gpd
from geoparquet_io.core.convert import convert_to_geoparquet

from utils import init_db_con


def download_sample_data(fgb_path: Path, gpkg_path: Path, gpkg_zip_path: Path):
    # URL to download
    url = "https://flatgeobuf.org/test/data/UScounties.fgb"

    # Download, saving to the current directory
    urlretrieve(url, fgb_path)

    gdf = gpd.read_file(fgb_path)

    # Randomize the dataframe
    gdf = gdf.sample(frac=1).reset_index(drop=True)

    # Save to GeoPackage
    gdf.to_file(gpkg_path)

    with zipfile.ZipFile(gpkg_zip_path, mode="w", compresslevel=9) as zf:
        zf.write(gpkg_path, arcname=gpkg_path.name)


def gpkg_to_parquet_geopandas(input_path: Path, output_path: Path):
    gdf = gpd.read_file(input_path)
    gdf.to_parquet(
        output_path,
        compression="zstd",
        write_covering_bbox=True,
        schema_version="1.1.0",
    )


def gpkg_to_parquet_duckdb(input_path: Path, output_path: Path):
    # Create the database
    con = init_db_con(read_only=True)

    con.execute(
        """
        COPY(
            SELECT * EXCLUDE(geom),
            geom AS geometry
            FROM st_read($input_path, allowed_drivers=["GPKG"])
        )
        TO $output_path
        (FORMAT parquet, COMPRESSION zstd, COMPRESSION_LEVEL 15, ROW_GROUP_SIZE 100_000);
        """,
        {"input_path": str(input_path), "output_path": str(output_path)},
    )


def gpkg_to_parquet_gpio(input_path: Path, output_path: Path):
    convert_to_geoparquet(input_file=str(input_path), output_file=str(output_path))


# def parquet_to_pmtimes(input_path: Path, output_path: Path):
#     # Create the database
#     con = init_db_con(read_only=False)

#     con.execute(
#         """
#         COPY(
#             SELECT *
#             EXCLUDE(geometry),
#             ST_Transform(ST_FlipCoordinates(geometry), 'epsg:4326', 'epsg:3857') AS geometry
#             FROM read_parquet($input_path)
#         )
#         TO $output_path
#         (FORMAT GDAL, DRIVER 'PMTiles');
#         """,
#         {
#             "input_path": str(input_path),
#             "output_path": str(output_path),
#         },
#     )


if __name__ == "__main__":
    main_folder = Path("data") / "eubucco"

    input_gpkg_path = main_folder / "v0_1-FRA.gpkg.zip"
    output_folder = Path(
        str(input_gpkg_path).removesuffix("".join(input_gpkg_path.suffixes))
    )
    output_folder.mkdir(exist_ok=True)
    file_name = output_folder.stem

    fgb_path = output_folder / f"{file_name}.fgb"
    parquet_pandas_path = output_folder / f"{file_name}_geopandas.parquet"
    parquet_duckdb_path = output_folder / f"{file_name}_duckdb.parquet"
    parquet_gpio_path = output_folder / f"{file_name}_gpio.parquet"

    # download_sample_data(
    #     fgb_path=fgb_path, gpkg_path=gpkg_path, gpkg_zip_path=gpkg_zip_path
    # )

    # t = time.perf_counter()
    # gpkg_to_parquet_geopandas(
    #     input_path=input_gpkg_path, output_path=parquet_pandas_path
    # )
    # print(f"gpkg_to_parquet_geopandas executed in {time.perf_counter() - t}")
    # t = time.perf_counter()
    # gpkg_to_parquet_duckdb(input_path=input_gpkg_path, output_path=parquet_duckdb_path)
    # print(f"gpkg_to_parquet_duckdb executed in {time.perf_counter() - t}")
    t = time.perf_counter()
    gpkg_to_parquet_gpio(input_path=input_gpkg_path, output_path=parquet_gpio_path)
    print(f"gpkg_to_parquet_gpio executed in {time.perf_counter() - t}")
