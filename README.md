# Apogee

An MDM for parents: Jamf Pro-style app and device management, scaled down for a family managing kids' iPads.

Parents keep child profiles (age, interests, device, screen-time goals) and a shared catalog of vetted apps. Apogee matches apps to each child by age and interests, and tracks per-child install status (Not Installed → Pushed → Installed / Removed).

Apogee is meant to both record the parent's decisions and act on the devices: getting apps from the shared catalog onto each child's iPad, either pushed by the parent or installed by the kids through a self-service catalog. How apps will be delivered is still being worked out.

> **Current state (Stage 1):** only the recording side exists. "Push" is a status marker for now, so it sends nothing to Apple or the device. Installation and Screen Time enforcement still happen manually on the iPad.

## Stack

pnpm workspace · React + Vite + Tailwind · Express 5 · PostgreSQL + Drizzle · OpenAPI + Orval codegen · Node 24

```
artifacts/apogee/       React web app
artifacts/api-server/   Express API (/api)
lib/db/                 Drizzle schema, migrations, seed
lib/api-spec/           OpenAPI contract (source of truth)
lib/api-client-react/   Generated React Query hooks
lib/api-zod/            Generated Zod schemas
docs/                   Handoff guide + original brief
```

## Quick start

```sh
pnpm install --frozen-lockfile
export DATABASE_URL=postgres://...         # never commit this

pnpm --filter @workspace/db run migrate    # apply versioned migrations
pnpm --filter @workspace/db run seed

pnpm test                                  # no database needed

PORT=8080 pnpm --filter @workspace/api-server run dev
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/apogee run dev
```

The frontend calls `/api` on its own origin and no local proxy exists yet, so outside Replit you need to route `/api/*` to port 8080. See [docs/HANDOFF.md §14](docs/HANDOFF.md#14-running-and-building).

## Docs

- [docs/HANDOFF.md](docs/HANDOFF.md): full usage guide, architecture, API reference, known gaps
- [docs/ROADMAP.md](docs/ROADMAP.md): current focus and what's next
- [docs/AUDIT.md](docs/AUDIT.md): code audit of the Replit build and the cleanup plan
- [docs/DECISIONS.md](docs/DECISIONS.md): device-control decision and the research behind it (MDM, ABM, Screen Time API)
- [docs/original-brief.md](docs/original-brief.md): the original Stage 1 product brief

## Security

There is no authentication yet. Do not expose the app or API publicly with real family data.
