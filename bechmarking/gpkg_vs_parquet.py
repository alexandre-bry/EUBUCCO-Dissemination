import duckdb
import os
import time

#TODO add a code to replace '-' with '_' and atomatically switch to other countries
gpkg_file = "v0_1_CYP.gpkg"
ogr_parquet_file = "v0_1_CYP_ogr2ogr.parquet"
gpio_parquet_file = "v0_1_CYP_gpio.parquet"

files = [
    ("gpkg", gpkg_file),
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
Test 2: Reading the full file 
    - See how long it takes to read the whole file. 
    - Use case example: When a user wants to download the whole dataset for a country.
"""
print()
print("Test 2: Reading the full file")

for name, path in files:
    if not os.path.exists(path): 
        continue

    start_time = time.time()

    if path.endswith(".gpkg"):
        con.sql(f"SELECT count(*) FROM ST_Read('{path}')").fetchall()
    else: 
        con.sql(f"SELECT count(*) FROM '{path}'").fetchall()

    end_time = time.time()
    print(f"{name:<20} : {end_time - start_time:.25f} seconds.")

"""
Test 3: Attribute access
    - See how long it takes to read only certain attributes, e.g. only get age or height
    - Use case example: Useful when wanting to visualize the data in graphs on the hosting website
"""
print()
print("Test 3: Attribute access")

for name, path in files:
    if not os.path.exists(path): 
        continue

    start_time = time.time()

    # for Cyprus age and type is NULL, so I only did height
    if path.endswith(".gpkg"):
        con.sql(f"SELECT min(height), avg(height), max(height) FROM ST_Read('{path}')").fetchall()
    else:
        con.sql(f"SELECT min(height), avg(height), max(height) FROM '{path}'").fetchall()   

    end_time = time.time()
    print(f"{name:<20} : {end_time - start_time:.10f} seconds.")

"""
Test 4: BBox filtering
    - See how long it takes to find data withing a certain bounding box (centered based on the data).
"""
print()
print("Test 4: BBox filtering")

center_coordinates = con.sql(f"""
                 SELECT
                    ST_X(ST_Centroid(ST_Extent(geom))),
                    ST_Y(ST_Centroid(ST_Extent(geom)))
                 FROM ST_Read('{gpkg_file}')
            """).fetchone()

cx,cy = center_coordinates[0], center_coordinates[1]

offset = 2000 #in meters
min_x, min_y = cx - offset, cy - offset
max_x, max_y = cx + offset, cy + offset

print(f"Bbox coordinates - min_x: {min_x:.1f}, min_y: {min_y:.1f}, max_x: {max_x:.1f}, max_y: {max_y:.1f}") 

for name, path in files:
    if not os.path.exists(path): 
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
                SELECT COUNT(*) FROM ST_Read('{path}')
                WHERE ST_Intersects({geo_col}, ST_MakeEnvelope({min_x}, {min_y}, {max_x}, {max_y}));
            """).fetchall()
    else:
        con.sql(f"""
                SELECT COUNT(*) FROM '{path}'
                WHERE ST_Intersects({geo_col}, ST_MakeEnvelope({min_x}, {min_y}, {max_x}, {max_y}));
             """).fetchall()
        
    end_time = time.time()
    print(f"{name:<20} : {end_time - start_time:.10f} seconds.")
