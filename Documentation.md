# Documentation

## Devcontainer

Install uv:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - 
sudo apt-get install -y nodejs
```

Install aws:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm awscliv2.zip
rm -rf aws
```

## S3 Storage Setup

We used the `aws` command to set up things that need CLI.
There is documentation [there for the setup](https://docs.hetzner.com/storage/object-storage/getting-started/using-s3-api-tools/) and [there for CORS](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/cors/).