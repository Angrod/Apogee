import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as runMigrations } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Idle clients emit 'error' when the database drops the connection (restart,
// network blip, failover). Without a listener Node treats it as fatal and the
// whole process exits; the pool discards the broken client and reconnects.
pool.on("error", (err) => {
  console.error("Postgres pool error (idle client discarded):", err.message);
});
export const db = drizzle(pool, { schema });

// Apply the committed migrations in lib/db/migrations.
export function migrate() {
  return runMigrations(db, { migrationsFolder: path.resolve(import.meta.dirname, "../migrations") });
}

// Query operators, re-exported so callers share this package's single
// drizzle-orm instance instead of resolving their own copy.
export { and, arrayContains, eq, ne, type SQL } from "drizzle-orm";

export * from "./schema";
