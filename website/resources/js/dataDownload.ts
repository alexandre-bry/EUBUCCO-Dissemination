import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

// 1. File Mappings
const ISO_MAPPING: Record<string, string> = {
    at: "AUT", be: "BEL", bg: "BGR", hr: "HRV", cy: "CYP",
    cz: "CZE", dk: "DNK", ee: "EST", fi: "FIN", fr: "FRA",
    de: "DEU", el: "GRC", hu: "HUN", ie: "IRL", it: "ITA",
    lv: "LVA", lt: "LTU", lu: "LUX", nl: "NLD", pl: "POL",
    pt: "PRT", ro: "ROU", sk: "SVK", es: "ESP", se: "SWE",
    ch: "CHE" 
};

const BUCKET = "eubuccodissemination";
const S3_PATH_PREFIX = `s3://${BUCKET}/partition-country`;

async function initDuckDB() {
    const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
        mvp: { mainModule: duckdb_wasm, mainWorker: mvp_worker },
        eh: { mainModule: duckdb_eh_wasm, mainWorker: eh_worker }
    };
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
}

const S3_H3_PATH = `s3://${BUCKET}/parquet-h3`;

async function handleDownload() {
    const statusMsg = document.getElementById('status-message') as HTMLElement;
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    
    const countryCode = (document.getElementById('country-select') as HTMLSelectElement).value;
    const format = (document.getElementById('format-select') as HTMLSelectElement).value;
    const minLon = (document.getElementById('min-lon') as HTMLInputElement).value;
    const minLat = (document.getElementById('min-lat') as HTMLInputElement).value;
    const maxLon = (document.getElementById('max-lon') as HTMLInputElement).value;
    const maxLat = (document.getElementById('max-lat') as HTMLInputElement).value;

    if (!countryCode && !minLon) {
        alert("Please select a country or enter coordinates.");
        return;
    }

    statusMsg.innerText = "Initializing DuckDB...";
    downloadBtn.disabled = true;

    let db, conn;
    try {
        db = await initDuckDB();
        conn = await db.connect();

        // 2. Setup S3 Connection
        await conn.query(`
            INSTALL httpfs; LOAD httpfs;
            INSTALL spatial; LOAD spatial;
            
            SET s3_endpoint = 'fsn1.your-objectstorage.com'; 
            SET s3_url_style = 'path';
            SET s3_region = 'fsn1';
            SET s3_use_ssl = true;
            SET s3_access_key_id = '';
            SET s3_secret_access_key = '';
        `);
            
        let query = "";
        let outputFilename = "";

        if (minLon && minLat && maxLon && maxLat) {
            // --- BBOX FILTER ---
            // statusMsg.innerText = "Scanning all countries for BBox...";
            
            // const allFiles = Object.values(ISO_MAPPING).map(iso3 => `'${S3_PATH_PREFIX}/${iso3}.parquet'`).join(", ");

            // query = `
            //     SELECT * FROM read_parquet([${allFiles}])
            //     WHERE ST_Intersects(
            //         geometry, 
            //         ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326)
            //     )
            // `;
            // outputFilename = `eubucco_bbox.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;

            statusMsg.innerText = "Scanning dataset for matches (this may take a while)...";

            const globPath = `${S3_H3_PATH}/h3_cell=*/*.parquet`;

            query = `
                SELECT * FROM read_parquet('${globPath}', hive_partitioning=true)
                WHERE ST_Intersects(
                    geometry, 
                    ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326)
                )
            `;
            outputFilename = `eubucco_bbox.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;

        } else if (countryCode) {
            // --- COUNTRY FILTER ---
            const iso3 = ISO_MAPPING[countryCode];
            if(!iso3) throw new Error(`Mapping not found for ${countryCode}`);

            statusMsg.innerText = `Downloading ${iso3} dataset...`;
            
            // Read the specific file directly
            const specificFile = `${S3_PATH_PREFIX}/${iso3}.parquet`;
            
            query = `SELECT * FROM read_parquet('${specificFile}')`;
            outputFilename = `eubucco_${iso3}.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;
        }

        // 3. Execute Download
        statusMsg.innerText = "Processing (this may take a moment)...";
        
        if (format === 'geoparquet') {
            await conn.query(`COPY (${query}) TO '${outputFilename}' (FORMAT PARQUET)`);
        } else {
            await conn.query(`COPY (${query}) TO '${outputFilename}' WITH (FORMAT GDAL, DRIVER 'FlatGeobuf')`);
        }

        // 4. Trigger File Save
        statusMsg.innerText = "Saving file...";
        const buffer = await db.copyFileToBuffer(outputFilename);
        const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusMsg.innerText = "Done!";

    } catch (err: any) {
        console.error(err);
        statusMsg.innerText = "Error: " + err.message;
    } finally {
        if (conn) await conn.close();
        if (db) await db.terminate();
        downloadBtn.disabled = false;
    }
}

document.getElementById('download-btn')?.addEventListener('click', handleDownload);