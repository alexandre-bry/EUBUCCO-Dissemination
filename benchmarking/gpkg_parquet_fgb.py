import duckdb
import os
import time
import random
import pandas as pd
import sys

# --- CONFIGURATION ---
all_countries = {
    "Cyprus": "CYP",
    "Spain": "ESP",
    "France": "FRA"
}

# Check if a country was provided in the terminal
if len(sys.argv) < 2:
    print("Error: Please provide a country name (e.g., uv run gpkg_parquet_fgb.py Cyprus)")
    sys.exit(1)

target_country = sys.argv[1]

if target_country not in all_countries:
    print(f"Error: {target_country} not found in configuration. Available: Cyprus, Spain, France")
    sys.exit(1)

# Set the active country and code
country_name = target_country
code = all_countries[target_country]

all_results = []
con = duckdb.connect()
con.sql("INSTALL spatial; LOAD spatial;")

def get_geo_col(name, path):
    """Helper to find if geometry column is 'geom' or 'geometry'"""
    src = f"ST_Read('{path}')" if name in ["GPKG", "Zipped GPKG"] else f"'{path}'"
    cols = con.sql(f"DESCRIBE SELECT * FROM {src} LIMIT 1").df()['column_name'].tolist()
    return 'geometry' if 'geometry' in cols else 'geom'

# --- START OF BENCHMARK LOGIC ---

print(f"\n==========================================")
print(f"STARTING BENCHMARK: {country_name} ({code})")
print(f"==========================================")

# File paths 
gpkg_file = f"files/{code}/v0_1-{code}.gpkg"
zipped_gpkg_file = f"files/{code}/v0_1-{code}.gpkg.zip"
parquet_file = f"files/{code}/{code}.parquet"
fgb_file = f"files/{code}/{code}.fgb"

files = [
    ("GPKG", gpkg_file),
    ("Zipped GPKG", zipped_gpkg_file),
    ("GeoParquet", parquet_file),
    ("FlatGeobuf", fgb_file)
]

# --- TEST 1: STORAGE SIZE ---
print(f"[{country_name}] Test 1: Storage Size")
for name, path in files:
    if os.path.exists(path):
        size_mb = os.path.getsize(path) / (1024 * 1024)
        all_results.append({"Country": country_name, "Format": name, "Test": "Storage Size", "Metric": "MB", "Value": size_mb})

# --- TEST 2: COUNTING ALL ROWS ---
print(f"[{country_name}] Test 2: Counting Rows")
for name, path in files:
    if not os.path.exists(path): continue

    if country_name == "Spain" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue

    if country_name == "France" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue

    start_time = time.time()

    src = f"ST_Read('{path}')" if name in ["GPKG", "Zipped GPKG"] else f"'{path}'"
    con.sql(f"SELECT count(*) FROM {src}").fetchall()

    elapsed = time.time() - start_time

    all_results.append({"Country": country_name, "Format": name, "Test": "Row Count Speed", "Metric": "Seconds", "Value": elapsed})

# --- TEST 3: EXPORT TO CSV (Reading full file) ---
print(f"[{country_name}] Test 3: Export to CSV")
output_csv = f"temp_{code}.csv"
for name, path in files:
    if not os.path.exists(path): continue

    if country_name == "France" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue

    if country_name == "Spain" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue
    
    geo_col = get_geo_col(name, path)
    src = f"ST_Read('{path}')" if name in ["GPKG", "Zipped GPKG"] else f"'{path}'"
    
    start_time = time.time()

    con.sql(f"""
        COPY (SELECT * EXCLUDE {geo_col}, ST_AsText({geo_col}) AS wkt FROM {src}) 
        TO '{output_csv}' WITH (HEADER, DELIMITER ';')
    """)

    elapsed = time.time() - start_time
    
    all_results.append({"Country": country_name, "Format": name, "Test": "CSV Export Speed", "Metric": "Seconds", "Value": elapsed})

    if os.path.exists(output_csv): os.remove(output_csv)

# --- TEST 4: ATTRIBUTE ACCESS (Min/Max/Avg) ---
print(f"[{country_name}] Test 4: Attribute Access")
for name, path in files:
    if not os.path.exists(path): continue

    if country_name == "Spain" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue

    if country_name == "France" and name == "Zipped GPKG":
        print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
        continue

    src = f"ST_Read('{path}')" if name in ["GPKG", "Zipped GPKG"] else f"'{path}'"
    
    # Test Min/Max
    start_time = time.time()

    con.sql(f"SELECT min(height), max(height) FROM {src}").fetchall()

    elapsed = time.time() - start_time
    all_results.append({"Country": country_name, "Format": name, "Test": "Attr MinMax", "Metric": "Seconds", "Value": elapsed})
    
    # Test Avg
    start_time = time.time()

    con.sql(f"SELECT avg(height) FROM {src}").fetchall()

    elapsed = time.time() - start_time
    all_results.append({"Country": country_name, "Format": name, "Test": "Attr Avg", "Metric": "Seconds", "Value": elapsed})

# --- TEST 5: BBOX FILTERING ---
print(f"[{country_name}] Test 5: BBox Filtering")
if os.path.exists(gpkg_file):
    bounds = con.sql(f"SELECT ST_XMin(geom), ST_YMin(geom), ST_XMax(geom), ST_YMax(geom) FROM (SELECT ST_Extent(geom) AS geom FROM ST_Read('{gpkg_file}'))").fetchone()
    xmin, ymin, xmax, ymax = bounds
    
    for name, path in files:
        if not os.path.exists(path): continue

        if country_name == "Spain" and name == "Zipped GPKG":
            print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
            continue

        if country_name == "France" and name == "Zipped GPKG":
            print(f"   ! Skipping {name} for {country_name} to avoid excessive unzip time.")
            continue

        geo_col = get_geo_col(name, path)
        src = f"ST_Read('{path}')" if name in ["GPKG", "Zipped GPKG"] else f"'{path}'"
        
        for size in [500, 5000, 20000]:
            times = []
            reps = 5
            for _ in range(reps):
                rx = random.uniform(xmin, xmax - size)
                ry = random.uniform(ymin, ymax - size)
                st = time.time()
                con.sql(f"SELECT count(*) FROM {src} WHERE ST_Intersects({geo_col}, ST_MakeEnvelope({rx}, {ry}, {rx + size}, {ry + size}))").fetchall()
                times.append(time.time() - st)
            
            all_results.append({"Country": country_name, "Format": name, "Test": "BBox Filtering", "Metric": f"{size}m", "Value": sum(times)/len(times)})

# Save everything for a specific country
df = pd.DataFrame(all_results)
filename = f"benchmark_{country_name}.csv"
df.to_csv(filename, index=False)
print(f"\nSuccess! Data for {country_name} saved to {filename}")