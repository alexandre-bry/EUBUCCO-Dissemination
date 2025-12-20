from pathlib import Path

import duckdb


def init_db_con(read_only: bool):
    # Connect to the database
    # db_path = Path("database.db")
    # con = duckdb.connect(database=db_path, read_only=read_only)
    con = duckdb.connect()

    # Load the spatial features
    con.sql("INSTALL spatial;")
    con.sql("LOAD spatial;")

    return con
