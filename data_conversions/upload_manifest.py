import os

import boto3
from botocore.exceptions import NoCredentialsError
from constants import BUCKET_NAME, H3_PREFIX, S3_ENDPOINT
from dotenv import dotenv_values

"""
Uploads the manifest of all the GeoParquet files in the H3 partition to the S3 bucket.
"""

# --- CONFIGURATION ---
FILE_NAME = "manifest.json"

# Load keys
config = dotenv_values(".env")

if not config.get("ACCESS_KEY") or not config.get("SECRET_KEY"):
    print("Error: Keys not found in .env file.")
    exit(1)

# Initialize Client
s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=config["ACCESS_KEY"],
    aws_secret_access_key=config["SECRET_KEY"],
)


def upload_file():
    print(f"🚀 Uploading {FILE_NAME} to bucket '{BUCKET_NAME}'...")

    try:
        s3.upload_file(
            FILE_NAME,
            BUCKET_NAME,
            f"{H3_PREFIX}/{FILE_NAME}",
            ExtraArgs={"ContentType": "application/json", "ACL": "public-read"},
        )
        print("Upload Successful!")
        print(
            f"File is available at: https://{BUCKET_NAME}.fsn1.your-objectstorage.com/{FILE_NAME}"
        )

    except FileNotFoundError:
        print(f"Error: The file '{FILE_NAME}' was not found in this folder.")
    except NoCredentialsError:
        print("Error: Credentials not available.")
    except Exception as e:
        print(f"Upload failed: {e}")


if __name__ == "__main__":
    upload_file()
