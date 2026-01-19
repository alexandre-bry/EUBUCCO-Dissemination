import boto3
import json
import re
from botocore.exceptions import ClientError, EndpointConnectionError
from dotenv import dotenv_values

# --- CONFIGURATION ---
# We use the base endpoint for the connection, and specify the bucket later
S3_ENDPOINT = "https://fsn1.your-objectstorage.com"
BUCKET_NAME = "eubuccodissemination"
PREFIX = "parquet-h3/"  # The folder to scan

# Load keys from .env file
config = dotenv_values(".env")

# Check if keys exist before proceeding
if not config.get('ACCESS_KEY') or not config.get('SECRET_KEY'):
    print("❌ Error: ACCESS_KEY or SECRET_KEY not found in .env file.")
    exit(1)

print("🔑 Keys loaded successfully.")

# Initialize S3 Client (Groupmate's style)
client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=config['ACCESS_KEY'],
    aws_secret_access_key=config['SECRET_KEY'],
)

def generate_manifest():
    print(f"\n--- 📂 Scanning bucket: {BUCKET_NAME} for H3 cells ---")
    
    found_cells = set()
    
    try:
        # Use a paginator to handle large file lists safely
        paginator = client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix=PREFIX)
        
        count = 0
        for page in pages:
            # Check if page is empty
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                key = obj['Key']
                
                # Regex to find "h3_cell=84..." and extract just the ID
                match = re.search(r'h3_cell=([a-f0-9]+)', key)
                if match:
                    cell_id = match.group(1)
                    found_cells.add(cell_id)
                    count += 1
                    
                    if count % 1000 == 0:
                        print(f"   ...scanned {count} files")

        # Save to JSON
        final_list = list(found_cells)
        with open('manifest.json', 'w') as f:
            json.dump(final_list, f)

        print(f"\n✅ SUCCESS: Found {len(final_list)} unique H3 cells.")
        print("📄 'manifest.json' has been created in this folder.")
        print("👉 Next step: Upload 'manifest.json' to the root of your Hetzner bucket.")

    except EndpointConnectionError:
        print("❌ Endpoint does not exist or is unreachable")
    except ClientError as e:
        print("⚠️ Endpoint reachable, but access denied or restricted")
        print(e)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    generate_manifest()