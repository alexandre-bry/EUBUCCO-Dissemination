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
    }),
);

const STYLES = ["Height", "Construction year", "Type"];
const ADMIN_LEVELS = ["ADM0", "ADM1", "ADM2"];

const HEIGHT_COLORS = [
    "#002f61",
    "#004d78",
    "#00688b",
    "#008396",
    "#009c9b",
    "#00b599",
    "#00cd8e",
    "#2ee379",
    "#81f15e",
    "#c2fa3d",
    "#ffff00",
];

const HEIGHT_VALUES = [0, 5, 10, 15, 20, 30, 40, 50, 60, 80, 100];

const YEAR_COLORS = [
    "#6f0000",
    "#872804",
    "#ad5d16",
    "#c98824",
    "#d6a725",
    "#dbbb1f",
    "#a9b657",
    "#5faa7d",
    "#328573",
    "#1a5659",
    "#043d49",
];
const YEAR_VALUES = [
    1000, 1300, 1500, 1600, 1700, 1800, 1900, 1950, 1975, 2000, 2025,
];

const TYPE_COLORS = ["#003dc1", "#ffb300", "#dddddd"];
const TYPE_VALUES = ["residential", "non-residential", "other"];

function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

const LEGEND_DATA: Record<string, { label: string; color: string }[]> = {
    Height: HEIGHT_VALUES.map((height, index) => ({
        label: height.toString() + "m",
        color: HEIGHT_COLORS[index],
    })),
    "Construction year": YEAR_VALUES.map((year, index) => ({
        label: year.toString(),
        color: YEAR_COLORS[index],
    })),
    Type: TYPE_VALUES.map((type, index) => ({
        label: capitalizeFirstLetter(type.toString()),
        color: TYPE_COLORS[index],
    })),
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

        data.forEach((item) => {
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
        this._map.setGlobalStateProperty("current-style", STYLES[0]);

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

                this._container
                    .querySelectorAll(".attribute-button")
                    .forEach((btn) => btn.classList.remove("active"));
                button.classList.add("active");
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
                        "#dddddd",
                        [
                            "interpolate",
                            ["linear"],
                            ["to-number", ["get", "height"]],
                            ...HEIGHT_VALUES.flatMap((height, i) => [
                                height,
                                HEIGHT_COLORS[i],
                            ]),
                        ],
                    ],
                    "Construction year",
                    [
                        "match",
                        ["to-string", ["get", "age"]],
                        "",
                        "#dddddd",
                        [
                            "interpolate",
                            ["linear"],
                            ["to-number", ["get", "age"]],
                            ...YEAR_VALUES.flatMap((year, i) => [
                                year,
                                YEAR_COLORS[i],
                            ]),
                        ],
                    ],
                    "Type",
                    [
                        "match",
                        ["get", "type"],
                        ...TYPE_VALUES.slice(0, -1).flatMap((type, i) => [
                            type,
                            TYPE_COLORS.at(i),
                        ]),
                        TYPE_COLORS.at(-1),
                    ],
                    "#dddddd",
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

const S3_PATH = import.meta.env.PROD
    ? "https://eubuccodissemination.fsn1.your-objectstorage.com"
    : "/api";

map.on("load", () => {
    const legend = new LegendControl();
    const styles_control = new BuildingsStyleControl(STYLES, legend);
    load_pmtiles(S3_PATH + "/all_countries_new_new.pmtiles");

    map.addControl(styles_control, "top-left");
    map.addControl(legend, "bottom-left");
});
