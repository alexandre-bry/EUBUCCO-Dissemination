# Report stuff

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
