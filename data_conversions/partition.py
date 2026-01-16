# External
import geoparquet_io as gpio
from pathlib import Path
import geopandas as gpd
import concurrent.futures
import os
import logging
import argparse

from geoparquet_io.core.add_bbox_column import add_bbox_column
from geoparquet_io.core.hilbert_order import hilbert_order
from geoparquet_io.core.partition_by_h3 import partition_by_h3
from geoparquet_io.core.check_parquet_structure import check_all

def partition_gpkg_to_parquet(
    input_dir : Path,
    output_dir: Path,
    countries: list[str] | None = None,
    max_workers: int | None = None,
    overwrite: bool = False,
):
    
    all_files = list(input_dir.glob("*.gpkg"))

    if countries is not None:
        countries = {c.upper() for c in countries}
        all_files = [
            f for f in all_files
            if f.stem.upper() in countries
        ]
    #print(all_files)

    logging.info(f"Converting all gpkg in {input_dir} to {output_dir}")
    #output_dir.mkdir(parents=True, exist_ok=True)

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )

    tasks = [
        (
            file,
            output_dir / f"{file.stem}.parquet"
        )
        for file in all_files
    ]

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(partition_gpkg_to_parquet_one_country, *tasks_separated)
        
            #logging.debug(f"Set {country_code}.gpkg_path = {result}")


    print(list(results))
    logging.info("Done converting gpkg to parquet")

def partition_gpkg_to_parquet_one_country(
        INPUT_PATH : Path,
        OUTPUT_PATH : Path,
):
    # Read the GeoPackage
    gdf = gpd.read_file(INPUT_PATH)

    # Convert to WGS84 if not already
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
        #print("Converted GeoDataFrame to WGS84 (EPSG:4326)")
    
    # Save to parquet for gpio workflow
    gdf.to_parquet(OUTPUT_PATH)
    print(f"Processed {INPUT_PATH} to {OUTPUT_PATH}")

def partition_parquet_to_h3(
    input_dir : Path,
    output_dir: Path,
    countries: list[str] | None = None,
    max_workers: int | None = None,
    overwrite: bool = False,
):
    
    all_files = list(input_dir.glob("*.parquet"))

    if countries is not None:
        countries = {c.upper() for c in countries}
        all_files = [
            f for f in all_files
            if f.stem.upper() in countries
        ]
    
    #print(all_files)

    logging.info(f"Converting all parquet in {input_dir} to {output_dir}")
    #output_dir.mkdir(parents=True, exist_ok=True)

    # Use as many workers as there are CPU cores unless overridden
    workers = (
        max_workers
        or (len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None)
        or 4
    )

    tasks = [
        (
            file,
            output_dir
        )
        for file in all_files
    ]
    print(tasks)

    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        tasks_separated = [
            [tasks[i][j] for i in range(len(tasks))] for j in range(len(tasks[0]))
        ]
        results = pool.map(partition_parquet_to_h3_one_country, *tasks_separated)
        
            #logging.debug(f"Set {country_code}.gpkg_path = {result}")


    #print(list(results))
    logging.info("Done converting gpkg to parquet")

def partition_parquet_to_h3_one_country(INPUT_PATH : Path,
                                        OUTPUT_PATH : Path):

    print(f"Reading {INPUT_PATH}")
    # Hilbert-order, h3, partition
    __ = gpio.read(INPUT_PATH) \
        .add_bbox() \
        .partition_by_h3(output_dir = OUTPUT_PATH,
                         resolution = 4)

    print(f"Partitioned {INPUT_PATH} at: {OUTPUT_PATH}")

def cli():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p1 = sub.add_parser("gpkg-to-parquet")
    p1.add_argument("input_dir", type=Path)
    p1.add_argument("output_dir", type=Path)
    p1.add_argument(
        "--countries",
        nargs="+",
        help="List of country codes to process (e.g. DEU FRA ITA)",
    )

    p2 = sub.add_parser("parquet-to-h3")
    p2.add_argument("input_dir", type=Path)
    p2.add_argument("output_dir", type=Path)
    p2.add_argument(
        "--countries",
        nargs="+",
        help="List of country codes to process (e.g. DEU FRA ITA)"),

    args = parser.parse_args()

    if args.command == "gpkg-to-parquet":
        partition_gpkg_to_parquet(
            input_dir=args.input_dir,
            output_dir=args.output_dir,
            countries=args.countries,
        )
    elif args.command == "parquet-to-h3":
        partition_parquet_to_h3(
            args.input_dir,
            args.output_dir,
        )

if __name__ == "__main__":
    cli()
    """    
    data_mount = Path("..", "data")
    gpkg_dir = data_mount / "gpkg"
    parquet_dir = data_mount / Path("partition", "country")
    h3_dir = data_mount / Path("partition", "parquet_h3_res4")
    
    partition_gpkg_to_parquet(gpkg_dir, parquet_dir)

    """


    #partition_parquet_to_h3(parquet_dir, h3_dir)
