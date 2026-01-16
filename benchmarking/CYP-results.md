Test 1: Storage Size Test
gpkg                 : 301.20 MB
zipped gpkg          : 142.43 MB (52.7% smaller)
ogr parquet          : 178.42 MB (40.8% smaller)
gpio parquet         : 136.82 MB (54.6% smaller)
flatgeobuf           : 259.39 MB (13.9% smaller)

Test 2: Counting all rows
gpkg                 : 0.0666639804840087890625000 seconds.
zipped gpkg          : 7.1809837818145751953125000 seconds.
ogr parquet          : 0.0005981922149658203125000 seconds.
gpio parquet         : 0.0003168582916259765625000 seconds.
flatgeobuf           : 0.3907220363616943359375000 seconds.

Test 3: Reading the full file - exporting it as CSV
gpkg                 : 1.659695 seconds (wrote CSV file of 457.5 MB)
zipped gpkg          : 7.199366 seconds (wrote CSV file of 457.5 MB)
ogr parquet          : 0.959226 seconds (wrote CSV file of 495.1 MB)
gpio parquet         : 0.800613 seconds (wrote CSV file of 506.8 MB)
flatgeobuf           : 1.916033 seconds (wrote CSV file of 454.3 MB)

Test 4: Attribute access
gpkg                 : min-max in 0.0642740726 seconds.
zipped gpkg          : min-max in 7.1181449890 seconds.
ogr parquet          : min-max in 0.0014810562 seconds.
gpio parquet         : min-max in 0.0013289452 seconds.
flatgeobuf           : min-max in 0.3930182457 seconds.
gpkg                 : avg in 0.0701820850 seconds
zipped gpkg          : avg in 7.1610820293 seconds
ogr parquet          : avg in 0.0010700226 seconds
gpio parquet         : avg in 0.0009980202 seconds
flatgeobuf           : avg in 0.3996820450 seconds

Test 5: BBox filtering
Generated 30 test scenarios.
gpkg                 | Size: 500   m | Avg: 0.1582 s | (Min: 0.1562 s | Max: 0.1598) s
gpkg                 | Size: 5000  m | Avg: 0.1613 s | (Min: 0.1565 s | Max: 0.1698) s
gpkg                 | Size: 20000 m | Avg: 0.1599 s | (Min: 0.1562 s | Max: 0.1683) s
zipped gpkg          | Size: 500   m | Avg: 7.2080 s | (Min: 7.1099 s | Max: 7.4273) s
zipped gpkg          | Size: 5000  m | Avg: 7.2255 s | (Min: 7.1723 s | Max: 7.2558) s
zipped gpkg          | Size: 20000 m | Avg: 7.2587 s | (Min: 7.1722 s | Max: 7.5008) s
ogr parquet          | Size: 500   m | Avg: 0.1150 s | (Min: 0.1127 s | Max: 0.1178) s
ogr parquet          | Size: 5000  m | Avg: 0.1131 s | (Min: 0.1114 s | Max: 0.1151) s
ogr parquet          | Size: 20000 m | Avg: 0.1129 s | (Min: 0.1104 s | Max: 0.1152) s
gpio parquet         | Size: 500   m | Avg: 0.1102 s | (Min: 0.1066 s | Max: 0.1128) s
gpio parquet         | Size: 5000  m | Avg: 0.1106 s | (Min: 0.1081 s | Max: 0.1130) s
gpio parquet         | Size: 20000 m | Avg: 0.1114 s | (Min: 0.1083 s | Max: 0.1159) s
flatgeobuf           | Size: 500   m | Avg: 0.5614 s | (Min: 0.5577 s | Max: 0.5674) s
flatgeobuf           | Size: 5000  m | Avg: 0.5587 s | (Min: 0.5546 s | Max: 0.5644) s
flatgeobuf           | Size: 20000 m | Avg: 0.5624 s | (Min: 0.5539 s | Max: 0.5802) s