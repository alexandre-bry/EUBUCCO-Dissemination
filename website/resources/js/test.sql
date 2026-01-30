INSTALL httpfs; LOAD httpfs;
INSTALL spatial; LOAD spatial;
SET s3_endpoint = 'data.source.coop'; 
SET s3_url_style = 'path';
SET s3_region = 'us-west-2';
SET s3_use_ssl = true;
-- SET threads = 1;            
-- SET max_memory = '1 GB';
SET preserve_insertion_order = false;

COPY (
    SELECT * FROM read_parquet(
        ['s3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb55ffffffff/841fb55ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb45ffffffff/841fb45ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb6bffffffff/841fb6bffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb63ffffffff/841fb63ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb0dffffffff/841fb0dffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb43ffffffff/841fb43ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb69ffffffff/841fb69ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb61ffffffff/841fb61ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb03ffffffff/841fb03ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb0bffffffff/841fb0bffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb41ffffffff/841fb41ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb09ffffffff/841fb09ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb01ffffffff/841fb01ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb47ffffffff/841fb47ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb65ffffffff/841fb65ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb39ffffffff/841fb39ffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb4dffffffff/841fb4dffffffff.parquet', 's3://abry-tudelft/eubucco/parquet/h3/h3_cell=841fb51ffffffff/841fb51ffffffff.parquet']
    )
    WHERE ST_Intersects(
            geometry, 
            ST_MakeEnvelope(1.2533::DOUBLE, 48.0868::DOUBLE, 3.6443::DOUBLE, 49.2720::DOUBLE)
        )
) TO 'test.parquet' (FORMAT PARQUET);