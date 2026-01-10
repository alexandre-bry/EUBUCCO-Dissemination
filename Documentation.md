# Documentation

## Ubuntu

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

Install gdal:

```bash
sudo apt install -y \
    build-essential \
    cmake \
    libproj-dev \
    libgeos-dev \
    libsqlite3-dev \
    libtiff5-dev \
    libjpeg-dev \
    libpng-dev \
    libcurl4-openssl-dev \
    libnetcdf-dev \
    libxml2-dev \
    libjson-c-dev \
    python3-dev python3-numpy \
    git wget
mkdir -p ~/gdal-build && cd ~/gdal-build
wget https://download.osgeo.org/gdal/3.12.1/gdal-3.12.1.tar.xz
tar xf gdal-3.12.1.tar.xz
cd gdal-3.12.1
mkdir build
cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/usr/local
cmake --build . -j"$(nproc)"
sudo cmake --build . --target install
```

Install tippecanoe:

```bash
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
make install
```

## S3 Storage Setup

We used the `aws` command to set up things that need CLI.
There is documentation [there for the setup](https://docs.hetzner.com/storage/object-storage/getting-started/using-s3-api-tools/) and [there for CORS](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/cors/).
