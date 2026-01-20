import * as duckdb from '@duckdb/duckdb-wasm';
import { polygonToCells } from "h3-js";
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// @ts-ignore
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';

// --- CONFIGURATION ---
const BUCKET_NAME = "eubuccodissemination";
const STORAGE_BASE_URL = "https://eubuccodissemination.fsn1.your-objectstorage.com";
const MANIFEST_URL = `${STORAGE_BASE_URL}/manifest.json`;
const S3_H3_PATH = `s3://${BUCKET_NAME}/parquet-h3`;
const H3_RESOLUTION = 4;

const ISO_MAPPING: Record<string, string> = {
    at: "AUT", be: "BEL", bg: "BGR", hr: "HRV", cy: "CYP",
    cz: "CZE", dk: "DNK", ee: "EST", fi: "FIN", fr: "FRA",
    de: "DEU", el: "GRC", hu: "HUN", ie: "IRL", it: "ITA",
    lv: "LVA", lt: "LTU", lu: "LUX", nl: "NLD", pl: "POL",
    pt: "PRT", ro: "ROU", sk: "SVK", es: "ESP", se: "SWE",
    ch: "CHE" 
};

// --- CACHING ---
let MANIFEST_CACHE: Set<string> | null = null;
let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// --- HELPERS ---
async function getManifest(): Promise<Set<string>> {
    if (MANIFEST_CACHE) return MANIFEST_CACHE;
    try {
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
        const cells = await response.json();
        MANIFEST_CACHE = new Set(cells);
        return MANIFEST_CACHE;
    } catch (e) {
        console.error("Manifest error:", e);
        return new Set();
    }
}

function getH3FilePaths(minLon: number, minLat: number, maxLon: number, maxLat: number): string[] {
    const polygon = [
        [minLat, minLon], [minLat, maxLon], [maxLat, maxLon], [maxLat, minLon], [minLat, minLon]
    ];
    const cells = polygonToCells(polygon, H3_RESOLUTION);
    return cells.map(cell => `${S3_H3_PATH}/h3_cell=${cell}/${cell}.parquet`);
}

async function initDuckDB() {
    if (db) return db;
    const bundles: duckdb.DuckDBBundles = {
        mvp: { mainModule: duckdb_wasm, mainWorker: mvp_worker },
        eh: { mainModule: duckdb_eh_wasm, mainWorker: eh_worker }
    };
    const bundle = await duckdb.selectBundle(bundles);
    const worker = new Worker(bundle.mainWorker!);
    const newDb = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
    await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return newDb;
}

// --- MAIN HANDLER ---
async function handleDownload() {
    const statusMsg = document.getElementById('status-message') as HTMLElement;
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    
    const countryCode = (document.getElementById('country-select') as HTMLSelectElement).value;
    const format = (document.getElementById('format-select') as HTMLSelectElement).value;
    const minLonStr = (document.getElementById('min-lon') as HTMLInputElement).value;
    const minLatStr = (document.getElementById('min-lat') as HTMLInputElement).value;
    const maxLonStr = (document.getElementById('max-lon') as HTMLInputElement).value;
    const maxLatStr = (document.getElementById('max-lat') as HTMLInputElement).value;

    const isBBoxSelection = !!(minLonStr && minLatStr && maxLonStr && maxLatStr);

    if (!countryCode && !isBBoxSelection) {
        alert("Please select a country or enter valid coordinates.");
        return;
    }

    downloadBtn.disabled = true;

    // --- DIRECT DOWNLOAD (FOR FULL COUNTRIES) ---
    if (countryCode && !isBBoxSelection) {
        const iso3 = ISO_MAPPING[countryCode];
        const extension = format === 'geoparquet' ? 'parquet' : 'fgb';
        const folder = format === 'geoparquet' ? 'partition-country' : 'partition-country-fgb';
        
        statusMsg.innerText = `Redirecting to full ${iso3} file...`;
        
        const directUrl = `${STORAGE_BASE_URL}/${folder}/${iso3}.${extension}`;
        
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = `eubucco_${iso3}.${extension}`;
        link.click();
        
        statusMsg.innerText = "Download started, the file will be downloaded soon!";
        downloadBtn.disabled = false;
        return; 
    }

    // --- DUCKDB PROCESSING DOWNLOAD (FOR BBOX) ---
    statusMsg.innerText = "Initializing engine...";

    try {
        db = await initDuckDB();
        conn = await db.connect();

        await conn.query(`
            INSTALL httpfs; LOAD httpfs;
            INSTALL spatial; LOAD spatial;
            SET s3_endpoint = 'fsn1.your-objectstorage.com'; 
            SET s3_url_style = 'path';
            SET s3_region = 'fsn1';
            SET s3_use_ssl = true;
            SET max_memory = '1.5GB';
        `);

        const nMinLon = parseFloat(minLonStr);
        const nMinLat = parseFloat(minLatStr);
        const nMaxLon = parseFloat(maxLonStr);
        const nMaxLat = parseFloat(maxLatStr);

        statusMsg.innerText = "Finding data cells...";
        const theoreticalFiles = getH3FilePaths(nMinLon, nMinLat, nMaxLon, nMaxLat);
        const validCells = await getManifest();
        const validFileList = theoreticalFiles.filter(path => {
            const cellId = path.split("h3_cell=")[1].split("/")[0].toLowerCase();
            return validCells.has(cellId);
        });

        if (validFileList.length === 0) {
            statusMsg.innerText = "No building data found in this region.";
            downloadBtn.disabled = false;
            return; 
        }

        // Safety limit to prevent memory crash
        if (validFileList.length > 250) {
            alert("Selection area is too large for browser-side processing. Please select a smaller area or download the whole country.");
            downloadBtn.disabled = false;
            return;
        }

        const fileListSQL = validFileList.map(f => `'${f}'`).join(", ");
        const outputFilename = `eubucco_custom.${format === 'geoparquet' ? 'parquet' : 'fgb'}`;

        const query = `
            SELECT * FROM read_parquet([${fileListSQL}], union_by_name = true)
            WHERE ST_Intersects(
                geometry, 
                ST_MakeEnvelope(${nMinLon}::DOUBLE, ${nMinLat}::DOUBLE, ${nMaxLon}::DOUBLE, ${nMaxLat}::DOUBLE)
            )
        `;

        statusMsg.innerText = "Extracting buildings (this may take a minute)...";

        if (format === 'geoparquet') {
            await conn.query(`COPY (${query}) TO '${outputFilename}' (FORMAT PARQUET)`);
        } else {
            await conn.query(`COPY (${query}) TO '${outputFilename}' WITH (FORMAT GDAL, DRIVER 'FlatGeobuf')`);
        }

        statusMsg.innerText = "Preparing file...";
        const buffer = await db.copyFileToBuffer(outputFilename);
        
        // Delete the file from DuckDB memory now that we have the JS buffer
        await db.dropFile(outputFilename);

        const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFilename;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        statusMsg.innerText = "Download complete!";

    } catch (err: any) {
        console.error(err);
        statusMsg.innerText = "Error: " + err.message;
    } finally {
        if (conn) await conn.close();
        downloadBtn.disabled = false;
    }
}

// --- MAP LOGIC ---
let map: maplibregl.Map;
let draw: MapboxDraw;

function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", 
        center: [15, 50],
        zoom: 3
    });

    draw = new MapboxDraw({
        displayControlsDefault: false,
        modes: {
            ...MapboxDraw.modes,
            'draw_rectangle': DrawRectangle
        }
    });

    map.addControl(draw as any);

    const updateInputsFromMap = () => {
        const data = draw.getAll();
        if (data.features.length > 0) {
            const coords = (data.features[0].geometry as any).coordinates[0];
            const lons = coords.map((p: any) => p[0]);
            const lats = coords.map((p: any) => p[1]);

            (document.getElementById('min-lon') as HTMLInputElement).value = Math.min(...lons).toFixed(4);
            (document.getElementById('max-lon') as HTMLInputElement).value = Math.max(...lons).toFixed(4);
            (document.getElementById('min-lat') as HTMLInputElement).value = Math.min(...lats).toFixed(4);
            (document.getElementById('max-lat') as HTMLInputElement).value = Math.max(...lats).toFixed(4);

            // Manually trigger the input event so existing exclusivity logic runs
            document.getElementById('min-lon')?.dispatchEvent(new Event('input'));
        }
    };

    map.on('draw.create', () => {
            updateInputsFromMap();
            
            // the "drawing" state to end
            setTimeout(() => {
                draw.changeMode('simple_select');
            }, 0);

            const drawBtn = document.getElementById('draw-bbox-btn');
            if (drawBtn) {
                drawBtn.classList.remove('active');
                drawBtn.innerText = "Draw Rectangle"; 
            }
        });

        // Update if the user drags the finished rectangle
        map.on('draw.update', updateInputsFromMap);
    }


// --- BUTTONS AND ACTION STUFF ---
const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
const fgbOption = formatSelect.querySelector('option[value="fgb"]') as HTMLOptionElement;

//Helper to restrict format based on selection type
function updateFormatVisibility(isBBoxActive: boolean) {
    if (isBBoxActive) {
        // Force selection to GeoParquet if BBox is used
        formatSelect.value = "geoparquet";
        fgbOption.disabled = true;
        fgbOption.textContent = "FlatGeobuf (Country only)";
    } else {
        fgbOption.disabled = false;
        fgbOption.textContent = "FlatGeobuf (.fgb)";
    }
}

document.getElementById('draw-bbox-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    
    // If we are already drawing, clicking again cancels it
    if (btn.classList.contains('active')) {
        draw.changeMode('simple_select');
        btn.classList.remove('active');
        btn.innerText = "Draw Rectangle";
    } else {
        draw.deleteAll();
        draw.changeMode('draw_rectangle');
        btn.classList.add('active');
        btn.innerText = "Click 2 points on map";
    }
});

document.getElementById('clear-bbox-btn')?.addEventListener('click', () => {
    draw.deleteAll();
    bboxInputs.forEach(input => {
        input.value = "";
        input.disabled = false;
        input.parentElement?.classList.remove('disabled-opacity');
    });
    countrySelect.disabled = false;
    
    const drawBtn = document.getElementById('draw-bbox-btn');
    if (drawBtn) {
        drawBtn.classList.remove('active');
        drawBtn.innerText = "Draw Rectangle";
    }

    // Reset format visibility since coordinates are cleared
    updateFormatVisibility(false);
});

// Initialize map on load
initMap();

document.getElementById('download-btn')?.addEventListener('click', handleDownload);

const countrySelect = document.getElementById('country-select') as HTMLSelectElement;
const bboxInputs = [
    document.getElementById('min-lon') as HTMLInputElement,
    document.getElementById('min-lat') as HTMLInputElement,
    document.getElementById('max-lon') as HTMLInputElement,
    document.getElementById('max-lat') as HTMLInputElement
];

// Handle BBox input (sruns for manual typing AND Map drawing)
bboxInputs.forEach(input => {
    input.addEventListener('input', () => {
        const hasBBoxValue = bboxInputs.some(i => i.value.trim() !== "");
        if (hasBBoxValue) {
            countrySelect.value = "";
            countrySelect.disabled = true;
            // Disable FlatGeobuf for BBox selections
            updateFormatVisibility(true);
        } else {
            countrySelect.disabled = false;
            draw.deleteAll();
            // Re-enable FlatGeobuf if coordinates are cleared
            updateFormatVisibility(false);
        }
    });
});

// Handle Country Selection
countrySelect.addEventListener('change', () => {
    if (countrySelect.value !== "") {
        bboxInputs.forEach(input => {
            input.value = "";
            input.disabled = true;
            input.parentElement?.classList.add('disabled-opacity');
        });
        if (draw) draw.deleteAll();
        
        // Country selection allows FlatGeobuf
        updateFormatVisibility(false);
    } else {
        bboxInputs.forEach(input => {
            input.disabled = false;
            input.parentElement?.classList.remove('disabled-opacity');
        });
    }
});

