# TODO

## Stuff we need to do

- [x] Start with Cyprus if memory is a problem
- [x] Test different configurations with some testing scripts:
    - Check different queries and their time
    - Experiment with querying bboxes from online data
- [x] Visualisation of the differences of different files
- [x] [S3 storage for the data](https://www.hetzner.com/storage/object-storage/)

## Tasks per person

- Carlo (Chief partitioning officer):
    - [x] Write code to partition files in 3 different ways (H3, etc, etc.).
    - [x] Look at object storage.
    - [ ] Compare partitions
    - [ ] Write section on partitions and comparison
- Alex:
    - [x] Small script to iterate over zip files, to be able to run the whole thing in one go.
    - [x] Prepare some data to help Alena experiment with the tests.
    - [ ] Improve pmtiles
    - [x] Template report
- Alena:
    - [x] Write a script to take different files in different formats and compares: speed of querying etc. (GDAL/DuckDB) - compare GeoParquet and GeoPackage (possibly others)
    - [ ] Make download page nicer
    - [ ] Draw bounding box
    - [ ] FGB download per country
