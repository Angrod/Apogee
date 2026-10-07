import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { inject } from "vitest";

// @workspace/db reads DATABASE_URL at import time, so set it before any
// import of the app or the db package.
process.env.DATABASE_URL = inject("databaseUrl");

export const db = await import("@workspace/db");

export async function startApi() {
  const { default: app } = await import("../src/app");
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  async function call(method: string, path: string, body?: unknown, rawBody?: string) {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json" },
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: res.status, json, text };
  }

  return {
    call,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

let seq = 0;
const unique = (label: string) => `${label} ${process.pid}-${++seq}`;

export const childInput = (overrides: Record<string, unknown> = {}) => ({
  name: unique("Child"),
  age: 5,
  interests: ["Music"],
  deviceName: "Test iPad",
  screenTimeWeekday: 60,
  screenTimeWeekend: 90,
  appleArcade: false,
  ...overrides,
});

export const appInput = (overrides: Record<string, unknown> = {}) => ({
  name: unique("App"),
  appStoreUrl: "https://apps.apple.com/us/app/test/id1",
  category: "Music",
  ageMin: 3,
  ageMax: 8,
  interestTags: ["Music"],
  costModel: "Free",
  adStatus: "No Ads",
  notes: "",
  status: "Active",
  ...overrides,
});
