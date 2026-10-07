import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    // Localhost only by default; set HOST=0.0.0.0 to open it to your phone on the LAN.
    host: process.env.HOST ?? "localhost",
    fs: {
      strict: true,
    },
    // Browser calls go to /api on this origin; forward them to the Express API.
    proxy: {
      "/api": process.env.API_URL ?? "http://localhost:8080",
    },
  },
  preview: {
    port,
    host: process.env.HOST ?? "localhost",
  },
});
