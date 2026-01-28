"""
Measuring query performance of h3 and country partitions
"""
# External
import boto3
import botocore
import pyarrow.parquet as pq
import shapely.wkb
import s3fs
import json
from pathlib import Path

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

# Necessary for setup of workflow
def list_all_files_country_files():
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



def bbox_to_country_code(bbox:list) -> list:
    """
    Returns the list of 3-letter country codes given a bounding box 
    
    :param bbox: List of coordinates [longmin, latmin, longmax, latmax]
    """
    pass

def bbox_to_h3_code(bbox:list) -> list:
    """
    Returns list of h3-indices given a bounding box
    
    :param bbox: Description
    
    """
    pass

def generate_bbox_set(num_cat: int = 3, boxes_per_cat: int = 10):
    """
    Gernerates a series of bounding boxes at different scales
    
    :param num_cat: Description
    :param boxes_per_cat: Description
    """
    pass




def main():
    
    pass

if __name__ == '__main__':
    main()