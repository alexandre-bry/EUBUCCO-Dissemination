import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // server: {
    //     proxy: {
    //         // (For DuckDB Data Download)
    //         "/s3": {
    //             target: "https://fsn1.your-objectstorage.com",
    //             changeOrigin: true,
    //             rewrite: (path) => path.replace(/^\/s3/, ""),
    //         },
    //     },
    // },
    base: "/EUBUCCO-Dissemination/",
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                data: resolve(__dirname, "data.html"),
                about: resolve(__dirname, "about.html"),
            },
        },
    },
});
