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

const LEGEND_DATA: Record<string, { label: string; color: string }[]> = {
    "Height": [
        { label: "0m", color: "#ffd044" },
        { label: "10m", color: "#ffb300" },
        { label: "20m", color: "#ff8401" },
        { label: "30m", color: "#ff5900" },
        { label: "40m+", color: "#fe3b00" },
    ],
    "Construction year": [
        { label: "Before 1945", color: "#d80004" },
        { label: "1965", color: "#ff8000" },
        { label: "1985", color: "#feca2f" },
        { label: "2005", color: "#83cbe3" },
        { label: "2025", color: "#0970be" },
    ],
    "Type": [
        { label: "Residential", color: "#003dc1" },
        { label: "Non-residential", color: "#ffb300" },
        { label: "Other", color: "#ddd" },
    ]
};

class LegendControl {
    _container: HTMLElement;
    _map: maplibregl.Map | undefined;

    constructor() {
        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl map-legend";
    }

    onAdd(map: maplibregl.Map) {
        this._map = map;
        this.updateLegend("Height"); // Initial state
        return this._container;
    }

    updateLegend(styleName: string) {
        const data = LEGEND_DATA[styleName];
        if (!data) return;

        this._container.innerHTML = `<div class="legend-title">${styleName}</div>`;
        
        data.forEach(item => {
            const row = document.createElement("div");
            row.className = "legend-row";
            row.innerHTML = `
                <span class="legend-key" style="background-color: ${item.color}"></span>
                <span>${item.label}</span>
            `;
            this._container.appendChild(row);
        });
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }
}

class BuildingsStyleControl {
    _container: HTMLElement;
    _map: maplibregl.Map | undefined;
    styles: string[];
    legend: LegendControl;

    constructor(styles: string[], legend: LegendControl) {
        this.styles = styles;
        this.legend = legend;
        
        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl attribute-control-panel";
    }

    onAdd(map: maplibregl.Map) {
        this._map = map;

        const title = document.createElement("div");
        title.className = "panel-title";
        title.textContent = "Map Layers"; 
        this._container.appendChild(title);

        this.styles.forEach((style) => {
            let button = document.createElement("button");
            button.className = "attribute-button";
            
            if (style === "Height") button.classList.add("active");
            
            button.textContent = style;
            button.addEventListener("click", () => {
                if (!this._map) return;

                this._map.setGlobalStateProperty("current-style", style);
                
                this.legend.updateLegend(style);
                
                this._container.querySelectorAll('.attribute-button').forEach(btn => 
                    btn.classList.remove('active')
                );
                button.classList.add('active');
            });
            this._container.appendChild(button);
        });

        return this._container;
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
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
                            "#ffd044",
                            10,
                            "#ffb300",
                            20,
                            "#ff8401",
                            30,
                            "#ff5900",
                            40,
                            "#fe3b00",
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
                            "#d80004",
                            1965,
                            "#ff8000",
                            1985,
                            "#feca2f",
                            2005,
                            "#83cbe3",
                            2025,
                            "#0970be",
                        ],
                    ],
                    "Type",
                    [
                        "match",
                        ["get", "type"],
                        "residential",
                        "#003dc1",
                        "non-residential",
                        "#ffb300",
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
    const legend = new LegendControl(); 
    const styles_control = new BuildingsStyleControl(STYLES, legend);
    load_pmtiles(S3_PATH + "/all_countries.pmtiles");
        // load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-CYP.pmtiles");
    // load_pmtiles(S3_PATH + "/pmtiles/" + "v0_1-BGR.pmtiles");
    map.addControl(styles_control, "top-left");
    map.addControl(legend, "bottom-left"); 
});
