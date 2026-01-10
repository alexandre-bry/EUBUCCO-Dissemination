# Dissemination of EUBUCCO

Group project as part of the GEO5019-2025 course at TU Delft.
The goal of this project is to make accessing the [EUBUCCO dataset](https://eubucco.com/data/) quicker and more customizable, both in terms of download and visualization.

The website is available at <https://alexandre-bry.github.io/EUBUCCO-Dissemination/>.

## Installation

### Code

The code for data conversion is in [`./data_conversions/`](./data_conversions/).
First, install `uv`.
Then, you can install the project with:

```bash
cd data_conversions
uv sync                     # to install packages
```

After that, any command can be run by either activating the environment or running `uv run <command>` such as `uv run python main.py`.

### Website

The code for the website is in [`./website/`](./website/).
First install `npm`.
Then, you can run the website with:

```bash
cd website
npm ci              # to install packages
npm run dev:host    # to run
```

## Tools

### Data conversion

Several tools can be used for data conversion between the different formats that we have interest in:

| Name | Type | Import | Export |
| ---- | ---- | ---- | ---- |
| [`duckdb`](https://duckdb.org/) + [spatial extension](https://duckdb.org/docs/stable/core_extensions/spatial/overview) | CLI + Python library | Everything from GDAL/OGR + Parquet | Everything from GDAL/OGR + Parquet |
| [`ogr2ogr`](https://gdal.org/en/stable/programs/ogr2ogr.html#ogr2ogr) (gdal) | CLI + Python library | Everything from GDAL/OGR | Everything from GDAL/OGR + GeoParquet in a custom way |
| [`geoparquet-io`](https://geoparquet.org/geoparquet-io/) | CLI + Python library | GeoPackage, GeoParquet, GeoJSON, ShapeFile, File Geodatabase | GeoParquet |
| [`geopandas`](https://geopandas.org/en/stable/) | Python library | Everything from GDAL/OGR + GeoParquet in a custom way | Everything from GDAL/OGR + GeoParquet in a custom way |
| [`tippecanoe`](https://github.com/felt/tippecanoe) | CLI | GeoJSON, FlatGeoBuf, CSV | PMTiles |

To see all the vector formats supported by GDAL/OGR, see [this list of vector drivers](https://gdal.org/en/stable/drivers/vector/index.html).
It especially includes:

- GeoPackage
- GeoParquet
- GeoJSON
- FlatGeoBuf
- PMTiles
