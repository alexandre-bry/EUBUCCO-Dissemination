import { defineConfig } from "vite";

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
});
