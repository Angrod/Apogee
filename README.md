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

One-time setup (macOS):

```sh
brew install postgresql@18 && brew services start postgresql@18
/opt/homebrew/opt/postgresql@18/bin/createdb apogee
cp .env.example .env                       # DATABASE_URL for the local DB (gitignored)
pnpm install --frozen-lockfile
pnpm db:migrate                            # apply versioned migrations
pnpm db:seed                               # starter catalog (add --with-sample-children for test profiles)
```

Day to day:

```sh
pnpm dev        # API on :8080 and web on http://localhost:3000 (proxies /api)
pnpm test       # 41 tests; uses an in-memory Postgres, no setup needed
```

To use it from your phone on the home network, start with `HOST=0.0.0.0 pnpm dev` and open `http://<your-mac's-IP>:3000`. There's no login yet, so only do this on a network you trust.

## Docs

- [docs/HANDOFF.md](docs/HANDOFF.md): full usage guide, architecture, API reference, known gaps
- [docs/ROADMAP.md](docs/ROADMAP.md): current focus and what's next
- [docs/AUDIT.md](docs/AUDIT.md): code audit of the Replit build and the cleanup plan
- [docs/DECISIONS.md](docs/DECISIONS.md): device-control decision and the research behind it (MDM, ABM, Screen Time API)
- [docs/original-brief.md](docs/original-brief.md): the original Stage 1 product brief

## Security

There is no authentication yet. Do not expose the app or API publicly with real family data.
