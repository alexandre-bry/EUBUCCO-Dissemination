import json
import re

import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from constants import BUCKET_NAME, H3_PREFIX, S3_ENDPOINT
from dotenv import dotenv_values

"""
Creates the manifest of all the GeoParquet files in the H3 partition.
"""

# # Load keys from .env file
# config = dotenv_values(".env")

# # Check if keys exist before proceeding
# if not config.get("ACCESS_KEY") or not config.get("SECRET_KEY"):
#     print("Error: ACCESS_KEY or SECRET_KEY not found in .env file.")
#     exit(1)

# print("Keys loaded successfully.")

# Initialize S3 Client
client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    # aws_access_key_id=config["ACCESS_KEY"],
    # aws_secret_access_key=config["SECRET_KEY"],
)


def generate_manifest():
    print(f"\n--- Scanning bucket: {BUCKET_NAME} for H3 cells ---")

    found_cells = set()

    try:
        # Use a paginator to handle large file lists safely
        paginator = client.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix=H3_PREFIX)

        count = 0
        for page in pages:
            # Check if page is empty
            if "Contents" not in page:
                continue

            for obj in page["Contents"]:
                key = obj["Key"]

                # Regex to find "h3_cell=84..." and extract just the ID
                match = re.search(r"h3_cell=([a-f0-9]+)", key)
                if match:
                    cell_id = match.group(1)
                    found_cells.add(cell_id)
                    count += 1

                    if count % 1000 == 0:
                        print(f"   ...scanned {count} files")

        # Save to JSON
        final_list = list(found_cells)
        with open("manifest.json", "w") as f:
            json.dump(final_list, f)

        print("'manifest.json' has been created in this folder.")

    except EndpointConnectionError:
        print("Endpoint does not exist or is unreachable")
    except ClientError as e:
        print("Endpoint reachable, but access denied or restricted")
        print(e)
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    generate_manifest()
