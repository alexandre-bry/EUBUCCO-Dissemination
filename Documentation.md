# Documentation

## Ubuntu

### uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - 
sudo apt-get install -y nodejs
```

### aws

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm awscliv2.zip
rm -rf aws
```

### GDAL

To install the version 3.12.1 of GDAL, use:

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
```

Then you can either install with `sudo cmake --build . --target install` or add the binaries to the path with:

```bash
printf 'export PATH="$HOME/gdal-build/gdal-3.12.1/build/apps/:$PATH"\n\n' >> ~/.profile
```

If you cannot install the latest version of GDAL and you get an error that looks like this when running `uv sync`:

```raw
Using CPython 3.13.11
Creating virtual environment at: .venv
Resolved 64 packages in 209ms
  × Failed to build `gdal==3.12.1`
  ├─▶ The build backend returned an error
  ╰─▶ Call to `setuptools.build_meta.build_wheel` failed (exit status: 1)

      ...

      Exception: Python bindings of GDAL 3.12.1 require at least libgdal 3.12.1, but 3.7.0 was found

      hint: This usually indicates a problem with the package or the build environment.
  help: `gdal` (v3.12.1) was included because `eubucco-dissemination` (v0.1.0) depends on `gdal`
```

then you can specify your own version of GDAL in the [`pyproject.toml`](data_conversions/pyproject.toml) such as `"gdal==3.7.0"`.

### tippecanoe

To install the latest version of tippecanoe, use:

```bash
mkdir -p ~/tippecanoe-build && cd ~/tippecanoe-build
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
```

Then you can either install with `make install` or add the binaries to the path with:

```bash
printf 'export PATH="$HOME/tippecanoe-build/tippecanoe/:$PATH"\n\n' >> ~/.profile
```

If you get an error like `/tmp/node.XXCQPCsv: Too many open files` with tippecanoe commands, this can be fixed by increasing the max number of open files with: `ulimit -n 4096`.
See [this issue](https://github.com/mapbox/tippecanoe/issues/211) for more information.

## S3 Storage Setup

We used the `aws` command to set up things that need CLI.
There is documentation [there for the setup](https://docs.hetzner.com/storage/object-storage/getting-started/using-s3-api-tools/) and [there for CORS](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/cors/).
