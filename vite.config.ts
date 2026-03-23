import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    // Use `VITE_WP_API_BASE=/wp-json/wp/v2` in `.env` so API calls stay same-origin
    // and avoid CORS during local dev (adjust target to your local WP URL).
    proxy: {
      "/wp-json": {
        target: "http://bookora.local",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
