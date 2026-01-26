import boto3
import os
from pathlib import Path
from botocore.exceptions import ClientError, EndpointConnectionError
from dotenv import dotenv_values
import argparse
import logging

# --- CONFIG --- #
BUCKET_NAME = 'eubuccodissemination'
S3_ENDPOINT = "https://fsn1.your-objectstorage.com"
# S3_ENDPOINT = "https://fsn1.your-objectstorage.com"

config = dotenv_values(".env")

client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=config['ACCESS_KEY'],
    aws_secret_access_key=config['SECRET_KEY'],
)

def upload_folder_to_s3(
    local_folder: str,
    bucket_name: str,
    s3_prefix: str = ""
):
    """
    Uploads a local folder to S3 while preserving directory structure.

    :param local_folder: Path to local folder
    :param bucket_name: Target S3 bucket
    :param s3_prefix: Optional prefix inside the bucket
    """

    local_folder = os.path.abspath(local_folder)

    count = 0

    for root, _, files in os.walk(local_folder):
        for file in files:
            local_path = os.path.join(root, file)

            # Relative path inside the folder
            relative_path = os.path.relpath(local_path, local_folder)

            # Build S3 key
            s3_key = os.path.join(s3_prefix, relative_path)
            s3_key = s3_key.replace("\\", "/")  # Windows fix

            try:
                client.upload_file(local_path, bucket_name, s3_key)
                print(f"Uploaded: {s3_key} to {s3_prefix}")
                count += 1

            except (ClientError, EndpointConnectionError) as e:
                logging.info(f"Failed to upload {local_path}: {e}")

    logging.info(f"Uploaded {count} files to S3.")
    
def cli():
    parser = argparse.ArgumentParser(
        description="Upload a local folder to S3 preserving directory structure"
    )

    parser.add_argument(
        "local_folder",
        type=Path,
        help="Local folder to upload",
    )

    parser.add_argument(
        "s3_prefix",
        type=str,
        help="S3 prefix (folder) inside the bucket",
    )

    args = parser.parse_args()

    upload_folder_to_s3(
        local_folder=args.local_folder,
        bucket_name=BUCKET_NAME,
        s3_prefix=args.s3_prefix,
    )

if __name__ == '__main__':
    cli()
    #path_to_pq = Path("..", "data", "partition", "parquet_h3_res4")
    """
    upload_folder_to_s3(local_folder= path_to_pq,
                        bucket_name= BUCKET_NAME,
                        s3_prefix = "partition-h3"
                        )
    """

    #upload_folder_to_s3(local_folder= Path("..", "data", "parquet"),
    #                    bucket_name= BUCKET_NAME,
    #                    s3_prefix = "partition-country")