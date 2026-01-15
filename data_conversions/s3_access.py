import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from dotenv import dotenv_values

# --- CONFIG --- #
S3_ENDPOINT = "https://eubuccodissemination.fsn1.your-objectstorage.com"
# S3_ENDPOINT = "https://fsn1.your-objectstorage.com"

config = dotenv_values(".env")
print(config)

client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=config['ACCESS_KEY'],
    aws_secret_access_key=config['SECRET_KEY'],
)

try:
    client.list_buckets()
    print("Endpoint exists and is reachable")
except EndpointConnectionError:
    print("❌ Endpoint does not exist or is unreachable")
except ClientError as e:
    print("⚠️ Endpoint reachable, but access denied or restricted")
    print(e)


# BUCKET_NAME = "eubuccodissemination" 

# print(f"\n--- 📂 Listing files in: {BUCKET_NAME} ---")

# try:
#     response = client.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=30)
    
#     if 'Contents' in response:
#         for obj in response['Contents']:
#             print(f"📄 {obj['Key']}")
#     else:
#         print("⚠️ The bucket is empty or access is denied.")

# except Exception as e:
#     print("❌ Error listing files:", e)