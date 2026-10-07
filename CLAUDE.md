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
- `pnpm run typecheck`
- `pnpm --filter @workspace/api-spec run codegen`: run after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` / `run seed`: dev DB only, needs `DATABASE_URL`
- API: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- Web: `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/apogee run dev`

## Gotchas
- Change the OpenAPI spec first, then regenerate. Never hand-edit generated code in `lib/api-client-react` or `lib/api-zod`. Keep the OpenAPI title stable.
- Screen time is stored in minutes; the UI shows hours via `src/lib/screen-time.ts`.
- Option lists (tags, categories, statuses) come from `src/lib/catalog.ts`, which is built from the generated enums. Add a value in `openapi.yaml`, not in a page.
- Use `<Button asChild><Link/></Button>`, never a button inside a link.
- `GET /api/dashboard` writes to the DB (it creates missing status rows).
- The API validates with the Zod schemas generated from `openapi.yaml`. Use `parse()` and `notFound()` from `artifacts/api-server/src/lib/http.ts` in new routes; never read `req.body` directly. Orval drops `integer`, so integer fields need `multipleOf: 1`. Don't trust `z.coerce.boolean()` on query strings (`"false"` becomes `true`).
- There's no versioned migration history. The live DB has a UNIQUE *constraint* where the schema declares a unique *index*, so review diffs before `push`.
- The web dev server proxies `/api` to `API_URL` (default `http://localhost:8080`), so run both processes.
- No auth. Never commit `DATABASE_URL` or `.env` files.
