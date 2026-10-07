import { drizzle } from "drizzle-orm/node-postgres";
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

export * from "./schema";
