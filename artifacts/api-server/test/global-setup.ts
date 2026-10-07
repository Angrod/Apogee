import net from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { TestProject } from "vitest/node";

// One throwaway in-memory Postgres for the whole test run, with the real
// migrations applied. Nothing to install and nothing left behind.
export default async function setup(project: TestProject) {
  const pg = await PGlite.create();
  const port = await freePort();
  const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  const databaseUrl = `postgres://postgres@127.0.0.1:${port}/postgres?sslmode=disable`;

  // @workspace/db reads DATABASE_URL at import time, so set it first.
  process.env.DATABASE_URL = databaseUrl;
  const { migrate, pool } = await import("@workspace/db");
  await migrate();
  await pool.end();

  project.provide("databaseUrl", databaseUrl);

  return async () => {
    await server.stop();
    await pg.close();
  };
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as net.AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
