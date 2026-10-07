# Apogee

An MDM for parents: Jamf Pro-style device and app management, scaled down for a family managing kids' iPads. Read `docs/HANDOFF.md` for the current implementation and architecture. The original brief is `docs/original-brief.md`.

## Product direction

Apogee has two jobs: recording the parent's decisions (catalog, per-child status, notes) and acting on the devices. The goal is for apps to reach a child's iPad from the shared catalog, either pushed by the parent or installed by the kids themselves as long as the app is in the catalog. How that delivery will work is still open (MDM install commands, a self-service model like Jamf Self Service, or something else).

The current Stage 1 code only does the recording half. "Pushed" is still just a status marker. Until real delivery exists, the UI and docs should not imply that an install happened.

## Product invariants
- Keep the shared catalog (`apps`) separate from per-child state (`child_app_status`).
- Catalog removal is a soft delete (`status = Removed`). Keep records and notes.
- The DB is authoritative. No hardcoded demo data.
- The app must stay usable on a phone.

## Commands

- `pnpm install --frozen-lockfile`: pnpm only
- `pnpm run typecheck`
- `pnpm --filter @workspace/api-spec run codegen`: run after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` / `run seed`: dev DB only, needs `DATABASE_URL`
- API: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- Web: `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/apogee run dev`

## Gotchas

- Change the OpenAPI spec first, then regenerate. Never hand-edit generated code in `lib/api-client-react` or `lib/api-zod`. Keep the OpenAPI title stable.
- Screen time is stored in minutes; the UI uses hours.
- `GET /api/dashboard` writes (it creates missing status rows).
- `DELETE /api/apps/:id` hard-deletes and contradicts the soft-delete policy, so don't use it.
- There is no versioned migration history, and the live DB has a UNIQUE *constraint* where the schema declares a unique *index*. Review diffs before `push`.
- No local `/api` proxy exists yet (Replit's router handled it).
- No auth. Never commit `DATABASE_URL` or `.env` files.
