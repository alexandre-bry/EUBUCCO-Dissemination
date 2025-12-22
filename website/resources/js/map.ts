import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import BasemapControl from "maplibre-basemaps";

import * as pmtiles from "pmtiles";

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "v0_1-CYP_tippecanoe_z18.pmtiles";

const p = new pmtiles.PMTiles(PMTILES_URL);

// this is so we share one instance across the JS code and the map renderer
protocol.add(p);

// Base layers
const osm = {
    name: "Open Street Map",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 18,
    attribution: "osm",
};
const osmHot = {
    name: "OSM HOT",
    tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
};
const osmCycle = {
    name: "OSM Cycle",
    tiles: ["https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"],
};
const esriTerrain = {
    name: "Esri Terrain",
    tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    ],
    maxzoom: 13,
    attribution:
        "Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS",
};
const baseLayers = {
    osm,
    osmHot,
    osmCycle,
    esriTerrain,
};
const basemapControl = new BasemapControl({
    basemaps: baseLayers,
    initialBasemap: "osmHot",
});

// we first fetch the header so we can get the center lon, lat of the map.
p.getHeader().then((h) => {
    const map = new maplibregl.Map({
        container: "map",
        zoom: 13,
        center: [h.centerLon, h.centerLat],
        style: {
            version: 8,
            sources: {
                eubucco_cyprus: {
                    type: "vector",
                    url: `pmtiles://${PMTILES_URL}`,
                    attribution: `EUBUCCO v0.1 (Milojevic-Dupont, N. and Wagner)`,
                },
            },
            layers: [
                {
                    id: "buildings",
                    source: "eubucco_cyprus",
                    "source-layer": "v0_1CYP_ogr2ogrfgb",
                    type: "fill-extrusion",
                    paint: {
                        "fill-extrusion-color": [
                            "interpolate",
                            ["linear"],
                            ["get", "height"],
                            0,
                            "#ffffff",
                            10,
                            "#0000ff",
                            100,
                            "#ff0000",
                        ],
                        "fill-extrusion-opacity": 0.8,
                        "fill-extrusion-height": ["get", "height"],
                    },
                },
            ],
        },
    });
    // map.on("load", () => {
    // map.addControl(basemapControl, "top-right");
    // });
});
