import duckdb
import os
import time
import random

#TODO add a code to replace '-' with '_' and atomatically switch to other countries/maybe not necessary
gpkg_file = "v0_1-CYP.gpkg"
zipped_gpkg_file = "v0_1-CYP.zip"
ogr_parquet_file = "v0_1-CYP_ogr2ogr.parquet"
gpio_parquet_file = "v0_1-CYP_gpio.parquet"

files = [
    ("gpkg", gpkg_file),
    ("zipped gpkg", zipped_gpkg_file),
    ("ogr parquet", ogr_parquet_file),
    ("gpio parquet", gpio_parquet_file)
]

con = duckdb.connect()
con.sql("INSTALL spatial; LOAD spatial;")

"""
Test 1: Storage size test
    - See how much smaller Geoparquet is in comparison to Geopackage
"""

print("Test 1: Storage Size Test")

baseline_size = 0

for name, path in files:
    if os.path.exists(path):
        # convert bytes to megabytes, divide the byte value by (1024 * 1024)
        size_mb = os.path.getsize(path)/(1024 * 1024)
        if name == "gpkg":
            baseline_size = size_mb
            print(f"{name:<20} : {size_mb:.2f} MB")
        else: 
            difference = ((baseline_size - size_mb)/baseline_size)*100
            print(f"{name:<20} : {size_mb:.2f} MB ({difference:.1f}% smaller)")
    else: 
        print(f"File {name:<20} not found.")

"""
Test 2: Counting all rows
    - See how long it takes to read the whole file. 
"""
print()
print("Test 2: Counting all rows")

for name, path in files:
    if not os.path.exists(path): 
        continue

    start_time = time.time()

    if path.endswith(".zip"):
        continue

    if path.endswith(".gpkg"):
        con.sql(f"SELECT count(*) FROM ST_Read('{path}')").fetchall()
    else: 
        con.sql(f"SELECT count(*) FROM '{path}'").fetchall()

    end_time = time.time()
    print(f"{name:<20} : {end_time - start_time:.25f} seconds.")

"""
Test 3: File export as CSV
    - See how long it takes to read every single cell and convert geometry to WKT by exporting it to CSV
"""
print()
print("Test 3: Reading the full file - exporting it as CSV")

output_csv = "benchmark.csv"

for name, path in files:
    if not os.path.exists(path):
        continue

    if path.endswith(".zip"):
        continue

    if path.endswith(".gpkg"):
        columns = con.sql(f"DESCRIBE SELECT * FROM ST_Read('{path}')").df()['column_name'].tolist()
    else:
        columns = con.sql(f"DESCRIBE SELECT * FROM '{path}'").df()['column_name'].tolist()
    
    if 'geometry' in columns:
        geo_col = 'geometry'
    else:
        geo_col = 'geom'

    start_time = time.time()

    if path.endswith(".gpkg"):
        con.sql(f"""
                COPY( 
                    SELECT
                        * EXCLUDE {geo_col}, 
                        ST_AsText({geo_col}) AS wkt 
                    FROM ST_Read('{path}')
                ) TO '{output_csv}' WITH (HEADER, DELIMITER ';')
            """)
    else:
        con.sql(f"""
                COPY(
                    SELECT
                        * EXCLUDE {geo_col},
                        ST_AsText({geo_col}) AS wkt
                    FROM '{path}'
                ) TO '{output_csv}' WITH (HEADER, DELIMITER ';')
        """)
    
    end_time = time.time()
    csv_size = os.path.getsize(output_csv) / (1024 * 1024)

    print(f"{name:<20} : {end_time - start_time:.6f} seconds (wrote CSV file of {csv_size:.1f} MB)")

    if os.path.exists(output_csv):
        os.remove(output_csv)

"""
Test 4: Attribute access
    - See how long it takes to read only certain attributes, e.g. only get age or height
    - Use case example: Useful when wanting to visualize the data in graphs on the hosting website
"""
print()
print("Test 4: Attribute access")

for name, path in files:
    if not os.path.exists(path): 
        continue

    if path.endswith(".zip"):
        continue

    start_time = time.time()

    # for Cyprus age and type is NULL, so I only did height
    if path.endswith(".gpkg"):
        con.sql(f"SELECT min(height), max(height) FROM ST_Read('{path}')").fetchall()
    else:
        con.sql(f"SELECT min(height), max(height) FROM '{path}'").fetchall()   

    end_time = time.time()
    print(f"{name:<20} : min-max in {end_time - start_time:.10f} seconds.")

for name, path in files:
    if not os.path.exists(path): 
        continue

    if path.endswith(".zip"):
        continue

    start_time = time.time()

    if path.endswith(".gpkg"):
        con.sql(f"SELECT avg(height) FROM ST_Read('{path}')").fetchall()
    else:
        con.sql(f"SELECT avg(height) FROM '{path}'").fetchall()   

    end_time = time.time()

    print(f"{name:<20} : avg in {end_time - start_time:.10f} seconds")


"""
Test 5: BBox filtering
    - See how long it takes to find data withing a certain bounding box (centered based on the data).
"""

print()
print("Test 5: BBox filtering")

ref_bbox_file = files[0][1] # Reference file (GPKG)
if not os.path.exists(ref_bbox_file):
    print("Reference file missing")
    exit()

bounds = con.sql(f"""
    SELECT ST_XMin(geom), ST_YMin(geom), ST_XMax(geom), ST_YMax(geom)
    FROM (SELECT ST_Extent(geom) AS geom FROM ST_Read('{ref_bbox_file}'))
""").fetchone()

global_minx, global_miny, global_maxx, global_maxy = bounds

bbox_sizes = [500, 5000, 20000] # 500m, 5km, 20km
iterations = 10

#make same test scenarios for every file type
test_scenarios = {}

for size in bbox_sizes:
    scenarios = []
    for _ in range(iterations):
        # ensure the box within bounds by subtracting 'size'
        rand_x = random.uniform(global_minx, global_maxx - size)
        rand_y = random.uniform(global_miny, global_maxy - size)
        
        box = (rand_x, rand_y, rand_x + size, rand_y + size) #minx, miny, maxx, maxy
        scenarios.append(box)
    test_scenarios[size] = scenarios

print(f"Generated {len(bbox_sizes) * iterations} test scenarios.")

for name, path in files:
    if not os.path.exists(path):
        continue

    if path.endswith(".zip"):
        continue

    if path.endswith(".gpkg"):
        columns = con.sql(f"DESCRIBE SELECT * FROM ST_Read('{path}')").df()['column_name'].tolist()
    else:
        columns = con.sql(f"DESCRIBE SELECT * FROM '{path}'").df()['column_name'].tolist()
    
    if 'geometry' in columns:
        geo_col = 'geometry'
    else:
        geo_col = 'geom'

    # Iterate through pre-defined scenarios:
    for size, boxes in test_scenarios.items():

        times = []

        for box in boxes:
            local_minx, local_miny, local_maxx, local_maxy = box
            
            start_time = time.time()

            if path.endswith(".gpkg"):
                con.sql(f"""
                    SELECT count(*) FROM ST_Read('{path}')
                    WHERE ST_Intersects({geo_col}, ST_MakeEnvelope({local_minx}, {local_miny}, {local_maxx}, {local_maxy}))
                """).fetchall()
            else:
                con.sql(f"""
                    SELECT count(*) FROM '{path}'
                    WHERE ST_Intersects({geo_col}, ST_MakeEnvelope({local_minx}, {local_miny}, {local_maxx}, {local_maxy}))
                """).fetchall()
            
            times.append(time.time() - start_time)

        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)

        print(f"{name:<20} | Size: {size:<6}m | Avg: {avg_time:.4f} s | (Min: {min_time:.4f} s | Max: {max_time:.4f}) s")