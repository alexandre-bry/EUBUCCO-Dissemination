"""
Measuring query performance of h3 and country partitions
"""

# External
import boto3
import pyarrow.parquet as pq
import s3fs
import json
from pathlib import Path
import h3
from h3 import LatLngPoly
from shapely.geometry import box
import duckdb
import time

# Internal
from dotenv import dotenv_values

#---------------- S3 Configuration ----------------#
BUCKET_NAME = 'eubuccodissemination'
S3_ENDPOINT = "https://fsn1.your-objectstorage.com"

config = dotenv_values(".env")

client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=config['ACCESS_KEY'],
    aws_secret_access_key=config['SECRET_KEY'],
)
#--------------------------------------------------#
# Load globally
path_to_json = Path('..', 'data', 'bbox_countries.json')
with open(path_to_json) as f:
    bboxes_country = json.load(f)
#--------------------------------------------------#
# DuckDB Setup
conn = duckdb.connect("benchmark.db")
conn.execute(f"""
            INSTALL httpfs;
            LOAD httpfs;
            INSTALL spatial;
            LOAD spatial;

            SET s3_endpoint='fsn1.your-objectstorage.com';
            SET s3_region='us-east-1';  -- required, even if ignored
            SET s3_url_style='path';
            
            SET s3_access_key_id='{config['ACCESS_KEY']}';
            SET s3_secret_access_key='{config['SECRET_KEY']}';
            """)
#--------------------------------------------------#

# Necessary for setup of workflow
def list_all_files_country_files():
    """
    Lists all files at a folder location on S3 using folder pagination
    """
    parquet_files = []

    paginator = client.get_paginator("list_objects_v2")

    for page in paginator.paginate(
        Bucket=BUCKET_NAME,
        Prefix="partition-country/"
    ):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".parquet"):
                parquet_files.append(obj["Key"])

    return parquet_files

def generate_country_bboxes():
    """
    Extracts dict of all bboxes at given location on S3
    """
    # Get all files at folder location parquet-country
    country_parquet_keys = list_all_files_country_files()

    fs = s3fs.S3FileSystem(
        key=config["ACCESS_KEY"],
        secret=config["SECRET_KEY"],
        client_kwargs={
            "endpoint_url": S3_ENDPOINT
        }
    )

    country_bboxes = {}
    
    for country_key in country_parquet_keys:
        s3_path = f'eubuccodissemination/{country_key}'


        with fs.open(s3_path, "rb") as f:
            parquet_file = pq.ParquetFile(f)
            metadata = parquet_file.metadata
            geo_meta = json.loads(metadata.metadata[b"geo"].decode("utf-8"))
            bbox = geo_meta['columns']['geometry']['bbox']

            country_bboxes[country_key] = bbox

    # Write to JSON
    with open(Path('..', 'data') / 'bbox_countries.json', 'w') as fp:
        json.dump(country_bboxes, fp)



def bboxes_intersect(bbox1, bbox2):
# Unpack coordinates for clarity
    x1_min, y1_min, x1_max, y1_max = bbox1
    x2_min, y2_min, x2_max, y2_max = bbox2

    if x1_max <= x2_min or x2_max <= x1_min:
        return False

    if y1_max <= y2_min or y2_max <= y1_min:
        return False

    return True

def bbox_to_country_code(bbox_query:list) -> list:
    """
    Returns the list of 3-letter country key codes given a bounding box 
    
    :param bbox_query: List of coordinates [longmin, latmin, longmax, latmax]
    """

    print(f'Gathering country-keys for {bbox_query}')

    codes = []
    for code, bbox in bboxes_country.items():
        latmin, longmin, latmax, longmax = bbox
        
        if bboxes_intersect(bbox_query, bbox):
            codes.append(code)

    print(f'Found matching country-keys: {codes}')

    return codes

def bbox_to_h3_key(bbox:list, resolution : int = 4) -> list:
    """
    Returns list of h3-indices given a bounding box
    Queries at lower resolution to circumnavigate no-match issue
    Upscales to target resolution
    
    :param bbox: 
    :param resolution: h3 target res
    
    """

    # Convert bbox to h3shape
    print(f'Gathering h3-keys for {bbox}')

    longmin, latmin, longmax, latmax = bbox
    h3_poly = LatLngPoly([
        (latmin, longmin),
        (latmin, longmax),
        (latmax, longmax),
        (latmax, longmin)
    ])

    # Generate fine cells first, to alleviate no-match issue
    h3_cells_res7 = h3.polygon_to_cells(h3_poly, res = 7)

    # Convert to target res
    h3_keys = list({
        f'parquet-h3/h3_cell={parent}/{parent}.parquet'
        for cell in h3_cells_res7
        for parent in [h3.cell_to_parent(cell, resolution)]
    })

    print(f'Found matching h3-keys: {h3_keys}')

    return h3_keys

def generate_bbox_set(num_cat: int = 3, boxes_per_cat: int = 10):
    """
    Gernerates a series of bounding boxes at different scales
    
    :param num_cat: Description
    :param boxes_per_cat: Description
    """

    # TODO: randomize, seed, categorize, currently only returns one bbox
    longmin, latmin, longmax, latmax = -3.78133, 40.35909, -3.65715, 40.44644
    # 35.05446, 33.24058, 35.26784, 33.45211
    #16.1773, 48.1894, 16.4467, 48.3216
    
    bboxes = []

    bboxes.append([longmin, latmin, longmax, latmax])

    return bboxes
    
def retrieve_from_s3(keys: list[str], bbox: list):
    """
    Executes the actual performance part of the query
    """

    print(f'Querying keys {keys} with bounding box {bbox}')

    s3_paths = [f's3://{BUCKET_NAME}/{k}' for k in keys]
    sql_array = ", ".join([f"'{p}'" for p in s3_paths])

    long_min, lat_min, long_max, lat_max = bbox

    query = (f"""
            SELECT Count(*)
            FROM read_parquet([{sql_array}])
            WHERE ST_Intersects(
            geometry,
            ST_MakeEnvelope({long_min}, {lat_min},
                             {long_max}, {lat_max})
            )
            """)

    num_features = conn.execute(query).fetchall()

    return num_features

def write_results(result : list[dict], output_path : Path) -> None:
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=result[0].keys()
        )
        writer.writeheader()
        writer.writerows(result)

    print(f"Saved benchmark results to {output_path}")

def main():

    # Save results
    benchmark = []

    # Generate random set of bboxes
    bboxes = generate_bbox_set()

    for i, bbox in enumerate(bboxes):

        # 1. By country
        country_keys = bbox_to_country_code(bbox)
        
        # Retrieve & time
        start_time = time.time()
        country_num_features = retrieve_from_s3(keys = country_keys,
                                                bbox = bbox)
        
        country_query_time = time.time() - start_time
        print(f'Query took {country_query_time} s.')
        
        
        # 2. By h3
        h3_keys = bbox_to_h3_key(bbox)

        start_time = time.time()
        h3_num_features = retrieve_from_s3(keys = h3_keys,
                                           bbox = bbox)
        h3_query_time = time.time() - start_time
        print(f'Query took {h3_query_time} s to deliver.')

        # Store results
        benchmark.append({
            "bbox_id" : i,
            "longmin" : bbox[0],
            "latmin" : bbox[1],
            "longmax" : bbox[2],
            "latmax" : bbox[3],
            "country_time" : country_query_time,
            "country_num_features" : country_num_features,
            "country_num_files" : len(country_keys),
            "h3_time" : h3_query_time,
            "h3_num_features" : h3_num_features,
            "h3_num_files" : len(h3_keys)
        })

    write_results(result = benchmark,
                  output_path = Path('..', 'data', 'benchmark_result.csv'))




if __name__ == '__main__':
    main()