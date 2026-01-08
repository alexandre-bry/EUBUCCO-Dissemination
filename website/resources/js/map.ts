import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// import BasemapControl from "maplibre-basemaps";

import * as pmtiles from "pmtiles";

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// // Base layers
// const osm = {
//     name: "Open Street Map",
//     tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
//     maxzoom: 18,
//     attribution: "osm",
// };
// const osmHot = {
//     name: "OSM HOT",
//     tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
// };
// const osmCycle = {
//     name: "OSM Cycle",
//     tiles: ["https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"],
// };
// const esriTerrain = {
//     name: "Esri Terrain",
//     tiles: [
//         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
//     ],
//     maxzoom: 13,
//     attribution:
//         "Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS",
// };
// const baseLayers = {
//     osm,
//     osmHot,
//     osmCycle,
//     esriTerrain,
// };
// const basemapControl = new BasemapControl({
//     basemaps: baseLayers,
//     initialBasemap: "osmHot",
// });

const map = new maplibregl.Map({
    container: "map",
    center: [17, 52],
    zoom: 3.6,
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    // style: {
    //     version: 8,
    //     sources: {
    //         // base_layer: {
    //         //     type: "vector",
    //         //     url: "https://tiles.openfreemap.org/styles/bright",
    //         // },
    //         "raster-tiles": {
    //             type: "raster",
    //             tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    //             tileSize: 256,
    //             minzoom: 0,
    //             maxzoom: 19,
    //             attribution: "© OpenStreetMap contributors",
    //         },
    //     },
    //     layers: [
    //         {
    //             id: "simple-tiles",
    //             type: "raster",
    //             source: "raster-tiles",
    //         },
    //     ],
    // },
});

map.addControl(
    new maplibregl.NavigationControl({
        visualizePitch: true,
        visualizeRoll: true,
        showZoom: true,
        showCompass: true,
    })
);

const STYLES = ["Height", "Construction year", "Type"];

class BuildingsStyleControl {
    _container: HTMLElement;
    _map: maplibregl.Map | undefined;
    styles: string[];

    constructor(styles: string[]) {
        this.styles = styles;

        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
        this._map = undefined;
    }

    onAdd(map: maplibregl.Map) {
        this._map = map;
        this._map.setGlobalStateProperty("current-style", "Height");

        this.styles.forEach((style) => {
            let button = document.createElement("button");
            button.className = "style-control";
            button.textContent = style;
            button.addEventListener("click", (e) => {
                if (!this._map) {
                    return;
                }
                this._map.setGlobalStateProperty("current-style", style);
            });
            this._container.appendChild(button);
        });

        return this._container;
    }

    onRemove() {
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._map = undefined;
    }
}

var MIN_LON = Infinity;
var MAX_LON = -Infinity;
var MIN_LAT = Infinity;
var MAX_LAT = -Infinity;

// map.on("mousemove", (e) => {
//     const features = map.queryRenderedFeatures(e.point);
//     // Do something?
// });

function load_pmtiles(url: string) {
    const p = new pmtiles.PMTiles(url);
    // this is so we share one instance across the JS code and the map renderer
    protocol.add(p);

    p.getHeader().then((h) => {
        map.addSource(`eubucco_${url}`, {
            type: "vector",
            url: `pmtiles://${url}`,
            attribution: `EUBUCCO v0.1 (Milojevic-Dupont, N. and Wagner)`,
        });
        map.addLayer({
            id: `eubucco_${url}`,
            source: `eubucco_${url}`,
            "source-layer": "buildings",
            type: "fill-extrusion",
            paint: {
                "fill-extrusion-color": [
                    "match",
                    ["global-state", "current-style"],
                    "Height",
                    [
                        "match",
                        ["to-string", ["get", "height"]],
                        "",
                        "#ddd",
                        [
                            "interpolate",
                            ["linear"],
                            ["get", "height"],
                            0,
                            "#648FFF",
                            10,
                            "#785EF0",
                            20,
                            "#DC267F",
                            30,
                            "#FE6100",
                            40,
                            "#FFB000",
                        ],
                    ],
                    "Construction year",
                    [
                        "match",
                        ["to-string", ["get", "age"]],
                        "",
                        "#ddd",
                        [
                            "interpolate",
                            ["linear"],
                            ["get", "age"],
                            1945,
                            "#648FFF",
                            1965,
                            "#785EF0",
                            1985,
                            "#DC267F",
                            2005,
                            "#FE6100",
                            2025,
                            "#FFB000",
                        ],
                    ],
                    "Type",
                    [
                        "match",
                        ["get", "type"],
                        "residential",
                        "#648FFF",
                        "non-residential",
                        "#FFB000",
                        "#ddd",
                    ],
                    "#ddd",
                ],
                "fill-extrusion-opacity": 1.0,
                "fill-extrusion-height": ["to-number", ["get", "height"]],
            },
        });

        MIN_LON = Math.min(h.minLon, MIN_LON);
        MAX_LON = Math.max(h.maxLon, MAX_LON);
        MIN_LAT = Math.min(h.minLat, MIN_LAT);
        MAX_LAT = Math.max(h.maxLat, MAX_LAT);

        map.fitBounds([
            [MIN_LON, MAX_LON],
            [MIN_LAT, MAX_LAT],
        ]);

        // map.on("load", () => {
        // map.addControl(basemapControl, "top-right");
        // });
    });

    map.on("click", `eubucco_${url}`, (e) => {
        const properties = e.features?.at(0)?.properties;
        if (properties === undefined) {
            return;
        }
        const content = createPropertiesHTML(properties);
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(content)
            .addTo(map);
    });
}

function createPropertiesHTML(properties: Record<string, any>): HTMLElement {
    let propertiesDiv = document.createElement("div");
    propertiesDiv.className = "properties";
    Object.entries(properties)
        .filter(([key]) => !["id", "id_source"].includes(key))
        .forEach(([key, value]) => {
            let property = document.createElement("div");
            property.className = "property";
            let propertyName = document.createElement("span");
            propertyName.className = "property-name";
            propertyName.textContent = key;
            let propertyValue = document.createElement("span");
            propertyValue.className = "property-value";
            propertyValue.textContent = value;

            property.appendChild(propertyName);
            property.appendChild(propertyValue);

            propertiesDiv.appendChild(property);
        });
    if (propertiesDiv.children.length == 0) {
        propertiesDiv.textContent = "No information.";
    }
    return propertiesDiv;
}

// const S3_PATH = "https://eubuccodissemination.fsn1.your-objectstorage.com";
const S3_PATH = "/api";

map.on("load", () => {
    const styles_control = new BuildingsStyleControl(STYLES);
    load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-CYP.pmtiles");
    load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-BGR.pmtiles");
    map.addControl(styles_control, "top-left");
});
