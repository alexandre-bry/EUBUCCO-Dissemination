import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

async function initDuckDB() {
    const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
            mainModule: duckdb_wasm,
            mainWorker: mvp_worker,
        },
        eh: {
            mainModule: duckdb_eh_wasm,
            mainWorker: eh_worker,
        }
    };
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
}

async function handleDownload() {
    const statusMsg = document.getElementById('status-message') as HTMLElement;
    const country = (document.getElementById('country-select') as HTMLSelectElement).value;
    const format = (document.getElementById('format-select') as HTMLSelectElement).value;

    const minLon = (document.getElementById('min-lon') as HTMLInputElement).value;
    const minLat = (document.getElementById('min-lat') as HTMLInputElement).value;
    const maxLon = (document.getElementById('max-lon') as HTMLInputElement).value;
    const maxLat = (document.getElementById('max-lat') as HTMLInputElement).value;

    if (!country && !minLon) {
        alert("Please select a country or enter coordinates.");
        return;
    }

    statusMsg.innerText = "Initializing DuckDB...";

    let db, conn;
    try {
        db = await initDuckDB();
        conn = await db.connect();

        // 1. Setup S3 Connection
        // use window.location.host to point to local Vite proxy
        await conn.query(`
            INSTALL httpfs; LOAD httpfs;
            INSTALL spatial; LOAD spatial;
            
            -- DIRECT CONNECTION 
            SET s3_endpoint = 'fsn1.your-objectstorage.com'; 
            SET s3_url_style = 'path';
            SET s3_use_ssl = true;
            
            -- Force Region 
            --SET s3_region = 'us-east-1';
            
            -- Keys from .env
            --SET s3_access_key_id = '${import.meta.env.VITE_S3_ACCESS_KEY}';
            --SET s3_secret_access_key = '${import.meta.env.VITE_S3_SECRET_KEY}';
        `);

        const sourcePath = 's3://eubuccodissemination/partition-h3_res4/**/*.parquet';
            
        let query = "";
        let outputFilename = "";

        if (minLon && minLat && maxLon && maxLat) {
            // --- BBOX FILTER ---
            statusMsg.innerText = "Scanning H3 cells for BBox...";
            query = `
                SELECT * FROM read_parquet('${sourcePath}')
                WHERE ST_Intersects(
                    geometry, 
                    ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326)
                )
            `;
            outputFilename = `eubucco_bbox.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;

        } else if (country) {
            // --- COUNTRY FILTER ---
            statusMsg.innerText = "Filtering whole dataset for ${country}...";
            
            // Using ILIKE to be safe (case-insensitive)
            query = `
                SELECT * FROM read_parquet('${sourcePath}')
                WHERE id ILIKE '${country}%' 
            `;
            outputFilename = `eubucco_${country}.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;
        }

        // 3. Execute Download
        statusMsg.innerText = "Downloading...";
        
        if (format === 'geoparquet') {
            await conn.query(`COPY (${query}) TO '${outputFilename}' (FORMAT PARQUET)`);
        } else {
            await conn.query(`COPY (${query}) TO '${outputFilename}' WITH (FORMAT GDAL, DRIVER 'FlatGeobuf')`);
        }

        // 4. Trigger File Save
        const buffer = await db.copyFileToBuffer(outputFilename);
        const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusMsg.innerText = "Done";

    } catch (err: any) {
        console.error(err);
        statusMsg.innerText = "Error: " + err.message;
    } finally {
        if (conn) await conn.close();
        if (db) await db.terminate();
    }
}

document.getElementById('download-btn')?.addEventListener('click', handleDownload);