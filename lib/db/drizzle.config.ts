import { defineConfig } from "drizzle-kit";
import path from "path";

// `generate` only reads the schema; `migrate` needs DATABASE_URL and will
// report a clear connection error without it.
export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
