import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Proxies API calls to the Spring Boot backend during development so the SPA
// and API share an origin and cookies/headers work without extra CORS pain.
export default defineConfig({
    plugins: [react()],
    // This app is plain hand-authored CSS (no Tailwind). Without this, Vite's
    // PostCSS loader searches parent directories and picks up the unrelated
    // root-level Next.js scaffold's postcss.config.mjs (which requires
    // @tailwindcss/postcss), breaking the build. An explicit empty config
    // stops that upward search.
    css: {
        postcss: {},
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: process.env.BACKEND_URL || "https://momocircle-backend-577524068618.africa-south1.run.app",
                changeOrigin: true,
            },
        },
    },
});
