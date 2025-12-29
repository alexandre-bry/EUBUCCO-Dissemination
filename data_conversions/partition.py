# External
from geoparquet_io.core.add_bbox_column import add_bbox_column
from geoparquet_io.core.hilbert_order import hilbert_order
from geoparquet_io.core.partition_by_h3 import partition_by_h3
from pathlib import Path

# Internal
from main import gpkg_to_parquet_geopandas


if __name__ == "__main__":
    PATH_GPKG = Path("..", "data", "gpkg", "v0_1-CYP.gpkg")
    PATH_PQ = Path("..", "data", "parquet", "cyprus.parquet")
    gpkg_to_parquet_geopandas(PATH_GPKG, PATH_PQ)

"""
# Sort by Hilbert curve
hilbert_order(
    input_parquet="input.parquet",
    output_parquet="sorted.parquet",
    geometry_column="geometry",
    add_bbox=True,
    verbose=True
)

# Partition by H3
partition_by_h3(
    input_parquet="input.parquet",
    output_folder="output/",
    resolution=9,
    hive=False,
    verbose=True
)
"""