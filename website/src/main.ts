import "./style.css";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import * as pmtiles from "pmtiles";

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "v0_1-CYP_tippecanoe_z18.pmtiles";

const p = new pmtiles.PMTiles(PMTILES_URL);

// this is so we share one instance across the JS code and the map renderer
protocol.add(p);

// we first fetch the header so we can get the center lon, lat of the map.
p.getHeader().then((h) => {
    const map = new maplibregl.Map({
        container: "map",
        zoom: h.maxZoom - 2,
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
});
