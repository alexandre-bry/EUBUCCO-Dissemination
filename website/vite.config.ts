import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    server: {
        proxy: {
            "/api": {
                target: "https://eubuccodissemination.fsn1.your-objectstorage.com",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    base: "/EUBUCCO-Dissemination/",
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                data: resolve(__dirname, "data.html"),
                map: resolve(__dirname, "map.html"),
                about: resolve(__dirname, "about.html"),
            },
        },
    },
});
