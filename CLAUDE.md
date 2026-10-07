# Apogee

Family app-management tool (parent-facing, MDM-inspired) for curating and tracking apps on kids' iPads. Read `docs/HANDOFF.md` for the full product and architecture guide. The original brief is `docs/original-brief.md`.

## Working agreement

- Work on **one explicitly approved task at a time**. Finish it, report actual results and limits, then stop and wait for approval before starting the next task. Do not run through a roadmap unprompted.

## Product invariants

- Apogee records decisions; it does not control devices. Never present "Pushed" status, screen-time goals, or the Arcade flag as real installation, measurement, or enforcement.
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
