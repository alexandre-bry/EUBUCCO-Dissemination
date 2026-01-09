# External
import geoparquet_io as gpio
from geoparquet_io.core.add_bbox_column import add_bbox_column
from geoparquet_io.core.hilbert_order import hilbert_order
from geoparquet_io.core.partition_by_h3 import partition_by_h3
from geoparquet_io.core.check_parquet_structure import check_all
from pathlib import Path
import geopandas as gpd
import h3
from shapely.geometry import mapping

# Internal
from main import gpkg_to_parquet_geopandas, gpkg_to_parquet_gpio

def partition_gpkg_by_country_h3(gpkg_path : Path,
                              resolution : int):
    
    # Read the GeoPackage
    gdf = gpd.read_file(gpkg_path)

    # Convert to WGS84 if not already
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
        print("Converted GeoDataFrame to WGS84 (EPSG:4326)")
    
    # Save to parquet for gpio workflow
    gdf.to_parquet(PATH_PQ)

    # Hilbert-order, h3
    """
    __ = gpio.read(PATH_PQ) \
        .add_bbox() \
        .sort_hilbert() \
        .add_h3(resolution = resolution, column_name= f"h3_res{resolution}") \
        .write(PATH_PQ)
"""

    # Hilbert-order, h3, partition
    __ = gpio.read(PATH_PQ) \
        .add_bbox() \
        .partition_by_h3(output_dir = OUT_DIR, resolution = resolution)


    # Partition



if __name__ == "__main__":
    DATA_DIR = Path("..", "data") # Home data mount
    IN_DIR = DATA_DIR / "gpkg" # Folder with all gpkg
    OUT_DIR = DATA_DIR / "partition" / "parquet-h3" # One partition location
    
    
    SAMPLE_FILE = IN_DIR / "v0_1-CYP.gpkg"
    PATH_PQ = Path("..", "data", "parquet", "cyprus.parquet")

    # Call to partitioning
    partition_gpkg_by_country_h3(gpkg_path = SAMPLE_FILE, resolution = 4)


    # Read with gpd
    #f = gpd.read_parquet(PATH_PQ)
    #print(f)

    #print(f" Number of unique h3: {set(f["h3_res4"])}")




"""
    # Pathlib does not work with check_parquet_structure
    man_path = "/Users/carlocordes/Library/CloudStorage/OneDrive-Personal/MSc_Carlo/5019_Studio/EUBUCCO-Dissemination/data/parquet/cyprus.parquet"

    # Convert
    gpkg_to_parquet_gpio(PATH_GPKG, PATH_PQ)


    # Sort by Hilbert curve
    hilbert_order(
        input_parquet=man_path,
        output_parquet=man_path,
        geometry_column="geometry",
        verbose=True
    )

    partition_by_h3(
        input_parquet=man_path,
        output_folder="output/partition",
        resolution=2,
        hive=False,
        verbose=True,
        force = True
    )
    check_all(man_path)

# Partition by H3
partition_by_h3(
    input_parquet="input.parquet",
    output_folder="output/",
    resolution=9,
    hive=False,
    verbose=True
)
"""