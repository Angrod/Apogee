import path from "path";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, which requires PORT and BASE_PATH for the dev server.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
