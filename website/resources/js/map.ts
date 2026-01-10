import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import * as pmtiles from "pmtiles";

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
    container: "map",
    center: [17, 52],
    zoom: 3.6,
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
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
const ADMIN_LEVELS = ["ADM0", "ADM1", "ADM2"];

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
            button.addEventListener("click", (_) => {
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
            id: `eubucco_${url}-buildings`,
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

        map.on("click", `eubucco_${url}-buildings`, (e) => {
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

        ADMIN_LEVELS.forEach((level) => {
            // Add the administrative boundaries
            map.addLayer({
                id: `eubucco_${url}-${level}`,
                source: `eubucco_${url}`,
                "source-layer": level,
                type: "fill",
                paint: {
                    "fill-color": "#ddd",
                    "fill-opacity": 0.5,
                },
            });
            map.addLayer({
                id: `eubucco_${url}-${level}-line`,
                source: `eubucco_${url}`,
                "source-layer": level,
                type: "line",
                paint: {
                    "line-color": "#297",
                    "line-width": 5,
                    "line-blur": 5,
                },
            });

            // Make the administrative boundaries clickable
            map.on("click", `eubucco_${url}-${level}`, (e) => {
                const properties = e.features?.at(0)?.properties;
                if (properties === undefined) {
                    return;
                }
                const filteredProperties = {
                    Name: properties["shapeName"],
                    "ISO Code": properties["shapeISO"],
                };
                const content = createPropertiesHTML(filteredProperties);
                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setDOMContent(content)
                    .addTo(map);
            });
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
const S3_PATH = import.meta.env.PROD
    ? "https://eubuccodissemination.fsn1.your-objectstorage.com"
    : "/api";

map.on("load", () => {
    const styles_control = new BuildingsStyleControl(STYLES);
    load_pmtiles(S3_PATH + "/all_countries.pmtiles");
    // load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-CYP.pmtiles");
    // load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-BGR.pmtiles");
    map.addControl(styles_control, "top-left");
});
