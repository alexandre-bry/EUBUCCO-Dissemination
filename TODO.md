# TODO

## Stuff we need to do

- [ ] Start with Cyprus if memory is a problem
- [ ] Test different configurations with some testing scripts:
    - Check different queries and their time
    - Experiment with querying bboxes from online data
- [ ] Visualisation of the differences of different files
- [ ] [S3 storage for the data](https://www.hetzner.com/storage/object-storage/)

## Tasks per person

- Carlo (Chief partitioning officer):
    - [ ] Write code to partition files in 3 different ways (H3, etc, etc.).
    - [ ] Look at object storage.
- Alex:
    - [ ] Small script to iterate over zip files, to be able to run the whole thing in one go.
    - [ ] Prepare some data to help Alena experiment with the tests.
- Alena:
    - [ ] Write a script to take different files in different formats and compares: speed of querying etc. (GDAL/DuckDB) - compare GeoParquet and GeoPackage (possibly others)
