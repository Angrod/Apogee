import { defineConfig } from "drizzle-kit";
import path from "path";

// Load the repo-root .env for local development, if there is one.
try {
  process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch {
  // No .env: rely on the real environment.
}

// `generate` only reads the schema; `migrate` needs DATABASE_URL and will
// report a clear connection error without it.
export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  // Relative on purpose: drizzle-kit prefixes "./" when reading snapshots, which breaks absolute paths.
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
