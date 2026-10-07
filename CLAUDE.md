# Apogee

An MDM for parents: Jamf Pro-style app curation and device management, built for families managing kids' iPads. It started as a personal tool, and the goal is a multi-family product.

## Read first
- `docs/ROADMAP.md`: what's being worked on now and what's next.
- `docs/DECISIONS.md`: how device control will work and why.
- `docs/AUDIT.md`: known bugs, bloat, and the cleanup order.
- `docs/HANDOFF.md`: how the current app works (architecture, API, known gaps).
- `docs/original-brief.md`: the original Stage 1 brief.

## Product direction
Apogee does two jobs: it records the parent's decisions (catalog, per-child status, notes) and it acts on the devices. Device control uses paths that work for any family: App Store/Family Sharing flows plus Apple's Screen Time API (a native app). MDM (NanoMDM) waits until Apple confirms it's allowed for families. Until then it would only be used for this household.

The current code only does the recording part. "Pushed" is a status marker. Until real delivery exists, the UI and docs must not imply that an install happened.

## Product rules
- Keep the shared catalog (`apps`) separate from per-child state (`child_app_status`).
- Catalog removal is a soft delete (`status = Removed`). Keep records and notes.
- The DB is authoritative. No hardcoded demo data.
- The app must stay usable on a phone.
- The repo is public. Keep real family details (kids' names, etc.) out of it.

## Commands
- `pnpm install --frozen-lockfile`: pnpm only
- `pnpm dev`: API (:8080) + web (:3000) together; reads `DATABASE_URL` from the root `.env` (see `.env.example`). Local Postgres is Homebrew `postgresql@18`, database `apogee`.
- `pnpm db:migrate` / `pnpm db:seed` (`--with-sample-children` for test profiles) / `pnpm db:generate --name <change>`
- `pnpm run typecheck`
- `pnpm test`: Vitest. API tests run against an in-memory Postgres (PGlite) with the real migrations; no setup needed. Vitest doesn't typecheck, so run both.
- `pnpm --filter @workspace/api-spec run codegen`: run after editing `lib/api-spec/openapi.yaml`

## Gotchas
- Change the OpenAPI spec first, then regenerate. Never hand-edit generated code in `lib/api-client-react` or `lib/api-zod`. Keep the OpenAPI title stable.
- Screen time is stored in minutes; the UI shows hours via `src/lib/screen-time.ts`.
- Option lists (tags, categories, statuses) come from `src/lib/catalog.ts`, which is built from the generated enums. Add a value in `openapi.yaml`, not in a page.
- Use `<Button asChild><Link/></Button>`, never a button inside a link.
- `GET /api/dashboard` writes to the DB (it creates missing status rows).
- The API validates with the Zod schemas generated from `openapi.yaml`. Use `parse()` and `notFound()` from `artifacts/api-server/src/lib/http.ts` in new routes; never read `req.body` directly. Orval drops `integer`, so integer fields need `multipleOf: 1`. Don't trust `z.coerce.boolean()` on query strings (`"false"` becomes `true`).
- Import drizzle operators (`eq`, `and`, …) from `@workspace/db`, not `drizzle-orm`, so there's one drizzle instance.
- When stopping dev servers, kill by port (`lsof -tiTCP:3000 -sTCP:LISTEN`), not by a `vite` name pattern: other projects on this machine run Vite too.
- Schema changes go through generated migrations, never `drizzle-kit push`. DB enums (`lib/db/src/schema/enums.ts`) must match `openapi.yaml`; `api-server/src/lib/contract.ts` fails the typecheck if they don't.
- The web dev server proxies `/api` to `API_URL` (default `http://localhost:8080`), so run both processes.
- No auth. Never commit `DATABASE_URL` or `.env` files.
