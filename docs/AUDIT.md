# Code Audit: What Replit Built

_Audited 2026-10-07 against commit `a8b1eca`. This is analysis only. No code was changed._

## Verdict

The core of the app is small and mostly sound: about **1,900 lines of real code** (API routes, DB schema, 6 pages). The schema design is right (shared catalog plus a per-child junction table), and both TypeScript checks pass.

Around that core is **a lot of Replit template material**: roughly **12,000 lines of unused UI components and a second design-sandbox app**, about 35 unused packages, and Replit-only config. One of those config settings **stops the app from building on a Mac**.

There are also **real bugs**. One can silently overwrite your edits, one corrupts screen-time values, and the API accepts anything sent to it.

Severity: 🔴 must fix · 🟠 bug or risk · 🟡 cleanup · ⚪ note

---

## 1. Blockers

### ✅ 1.1 The app cannot build or run on macOS (fixed in step 1)
`pnpm-workspace.yaml` `overrides` strip the native binaries for every platform except Linux x64, including **darwin-arm64** for esbuild, rollup, lightningcss, and Tailwind's oxide. Replit did this to shrink its Linux installs.

**Verified on the M1:** `pnpm install` succeeds but installs no native binaries. `node build.mjs` (API) and `vite build` (web) both crash on a missing native module. TypeScript still passes because `tsc` is pure JavaScript.

**Fix:** delete the platform `overrides` block and the Replit `minimumReleaseAgeExclude` entries, then regenerate `pnpm-lock.yaml`. pnpm 11 also needs `esbuild` approved for build scripts (`onlyBuiltDependencies` already lists it, but a fresh install still reported `ERR_PNPM_IGNORED_BUILDS`).

### ✅ 1.2 No local routing between web and API (fixed in step 1)
The browser calls `/api/...` on the web app's own origin. On Replit, the platform router sent those calls to port 8080. Locally nothing does. **Fix:** add a `server.proxy` for `/api` in `artifacts/apogee/vite.config.ts`.

---

## 2. Bugs

### ✅ 2.1 Editing twice within 30 seconds can overwrite your changes
`artifacts/apogee/src/pages/child-form.tsx:128` and `app-form.tsx:166`. A save only invalidates the **list** query, not the single-record query (`getGetChildQueryKey` / `getGetAppQueryKey`). The global `staleTime` is 30s (`App.tsx:20`), so reopening the same record within 30 seconds fills the form with the **pre-save values** from cache. Saving again writes those old values back. **Fix:** invalidate (or set) the record query on success.

### ✅ 2.2 Screen-time values drift on every edit
`child-form.tsx:168` rounds stored minutes to **0.1 hour** for display, while the input step is **0.25 hour** (line 260). For example, 1.25 h is stored as 75 min, displayed as 1.3, and saved back as 78 min. **Fix:** don't round to 0.1. Show minutes directly or keep exact decimals.

### ✅ 2.3 The API trusts every request body
None of the routes validate input. The generated Zod schemas (`@workspace/api-zod`) are only used by `/healthz`. Consequences:
- An invalid `status` (e.g. `"Banana"`) fails the Postgres enum and returns an **HTML 500 with a stack trace** (Express 5's default handler in non-production).
- Non-numeric IDs (`/apps/abc`) turn into `NaN` and also 500.
- `PUT` replaces fields and fills defaults for anything omitted, so a partial update quietly resets `interests`, `notes`, `status`, etc.
- `category`, `costModel`, `adStatus`, and `apps.status` are free text in the DB, so a typo makes an app silently stop matching.

**Fix:** parse `req.body`/`req.params` with the generated schemas, add `enum`s to `openapi.yaml`, and add a JSON error handler.

### ✅ 2.4 The DELETE endpoints break the data rules
`routes/apps.ts:79` hard-deletes catalog apps, which goes against the soft-delete rule. `routes/children.ts:63` hard-deletes children. Both also **fail with a 500** once status rows exist, because the foreign keys have no `ON DELETE` behavior. The UI never calls either. **Fix:** remove both, or replace them with archive and cascade behavior.

### ✅ 2.5 Status updates aren't atomic
`routes/child-app-status.ts:12`: select, then insert or update. Two first writes at the same moment can hit the unique index and 500. It also doesn't check that the child and app exist. **Fix:** a single `insert … onConflictDoUpdate`.

### ✅ 2.6 The dashboard briefly shows the old status after a change
`dashboard.tsx:256`. On success, the optimistic override is cleared **immediately**, while the refetch isn't awaited. For a moment the card shows the old cached status again. Failed changes give no message to the user. **Fix:** await the invalidation (or write the result into the cache) before clearing the override, and show a toast on error.

### ✅ 2.7 The dashboard doesn't refresh after catalog or profile edits
App and child saves don't invalidate the dashboard query, so new matches can take up to 30 seconds to appear (already listed in HANDOFF §6).

### ✅ 2.8 Bad record IDs in the URL can create duplicates
`child-form.tsx:334` / `app-form.tsx:403`. `/children/abc` gives `NaN`, which counts as "editing" but shows an empty form. Then `if (isEditing && childId)` is false because `NaN` is falsy, so **Save creates a new record**. A missing ID (404) also shows an empty form instead of "not found."

### 🟠 2.9 Automatic schema push on merge
`scripts/post-merge.sh` (run by `.replit` after every git merge) runs `drizzle-kit push` against the live DB. The schema and the DB already differ (a unique index vs. a UNIQUE constraint), so this could change the live database without anyone reviewing it. It only fires on Replit, so it goes away when the Replit config is removed.

---

## 3. Data and seed issues

- 🟠 **The seed contradicts your own research:**
  - **GarageBand** is `ageMin: 6`, but it was picked for the 3-year-old (Smart Drums), so it will never match him.
  - **Toca Boca Jr** is seeded as **Free** with tag **Drawing**. It's a **subscription** (about $7.99/month) and is more about play and music.
  - **Aqua by Adobe** links to the Photoshop Sketch listing.
  - **Endless Alphabet's** cost model and ads need checking.
- 🟡 `children.interests` is `jsonb`, but `apps.interest_tags` is `text[]`: the same kind of data stored two ways. Hence the `as string[]` casts throughout.
- 🟡 The DB enum still has the legacy `Blocked` and `Limited` values, which the UI never uses.
- 🟡 No `onUpdate` for `updatedAt` (it's set by hand in each route). Timestamps are `timestamp without time zone`. There's no index on `child_app_status.app_id`.
- 🟡 `lastVerified` is set on **every** save, so it measures "last edited," not "last verified."
- ⚪ The seed child names are placeholders (good, since the repo is public). The real profiles live only in the Replit database.

---

## 4. Bloat to remove

| What | Size | Why it's safe to remove |
|---|---|---|
| `artifacts/mockup-sandbox/` | 69 files, ~6,700 lines | A Replit "Canvas" design-preview app. The real app never imports it. It's a near-copy of the UI kit with its own ~45 packages |
| Unused shadcn/ui components in `artifacts/apogee/src/components/ui/` | 45 of 55 files, ~5,300 lines | Only `badge, button, card, input, label, skeleton, switch, textarea, toast, toaster` are used. `tooltip` is only a provider wrapping the app, with no tooltips anywhere |
| Unused frontend packages | ~35 | 22 `@radix-ui/*` packages plus `cmdk, date-fns, embla-carousel-react, framer-motion, input-otp, next-themes, react-day-picker, react-icons, react-resizable-panels, recharts, sonner, vaul, @tailwindcss/typography` |
| `src/hooks/use-mobile.tsx` | | Only the unused `sidebar` uses it |
| Unused theme CSS in `index.css` | ~150 of 320 lines | Sidebar, chart, and dark-mode variables plus Replit's `elevate` utilities. The pages hard-code `stone-*`/`amber-*` colors and ignore the theme tokens anyway |
| API: `cookie-parser` (+ types) | | Never imported |
| API: `express.urlencoded()` | | No form posts |
| API: ~80-entry `external` list in `build.mjs` | | Template boilerplate "in case" packages get added |
| `scripts/` package (`hello.ts`) | | A placeholder "Hello from @workspace/scripts" |
| `src/lib/.gitkeep`, `src/middlewares/.gitkeep` | | Empty placeholders |
| `lib/integrations/*` in `pnpm-workspace.yaml` | | The directory doesn't exist |
| Server-side catalog filters (`category`, `interestTag`) | | The UI filters on the client and never sends them. Keep them only if the native app will use them |
| `custom-fetch.ts` extras (`setBaseUrl`, `setAuthTokenGetter`) | | Expo/React Native helpers. Harmless; could be useful later |

## 5. Replit leftovers

- `.replit`, `.replitignore`, `replit.md` (still template placeholders), and `artifacts/*/.replit-artifact/` (3 files).
- `@replit/vite-plugin-*` (3 packages) and the `REPL_ID` check in `vite.config.ts`. The `@assets` alias points at the deleted `attached_assets/`.
- The `gitsafe-backup` git remote (Replit's internal backup, unreachable from here).
- `index.html` placeholders: "Apogee — built on Replit. Update this description…", `robots: index, follow` plus `robots.txt Allow: /` (**a private family app should be `noindex`**), and `opengraph.jpg`/Twitter cards for a page that will never be shared.
- `index.html` sets `maximum-scale=1`, which disables pinch-zoom on phones (an accessibility problem).
- Dev server `host: 0.0.0.0` with `allowedHosts: true` exposes the dev app to everyone on your network. Reasonable on Replit; locally it should default to localhost.

## 6. Code quality

- 🟡 **Copy-pasted constants and components.** `INTEREST_TAGS` appears 3 times; `CATEGORIES`, `costColor`, `FormField`, and `InterestToggle` twice each. These lists should be defined once, ideally as enums in `openapi.yaml`, so the server, client, and native app share one list.
- 🟡 The dashboard matching logic is written **twice** in the same handler (`routes/dashboard.ts:22` and `:59`), and the response objects are rebuilt field by field even though `res.json` already serializes them. The matching rules should be one shared function, which the native app will also need.
- 🟡 `GET /api/dashboard` writes to the DB on every load (it initializes status rows). It's a side effect hidden in a read.
- 🟡 `<Link><Button>` puts a `<button>` inside an `<a>` (invalid HTML; screen readers announce it twice). This happens 6 times.
- 🟡 Two versions of Zod are mixed: the DB uses `zod/v4`, while the forms use the v3 API (`invalid_type_error`, `required_error`).
- 🟡 `tsconfig.base.json` turns strictness *off* in places (`strictFunctionTypes: false`, no `strict: true`).
- 🟡 The 404 page shows developer text to users ("Did you forget to add the page to the router?").
- 🟡 Errors on the catalog page show both the error banner *and* "No apps match your filters."
- 🟡 The dashboard sorts children by name; the children page sorts by ID.
- 🟡 The API `dev` script does a full build and then starts, with no watch mode, so every change means a restart.
- ⚪ **No tests at all.** HANDOFF §17's acceptance checks would make a good first test suite.
- ⚪ CORS allows any origin, and there's no auth (known; on the roadmap).

## 7. Done right (keep)

- The schema design (catalog plus per-child junction table, soft delete) and the DB unique index.
- The OpenAPI contract with generated React Query hooks. A good base, once enums are added and the server actually uses the generated schemas.
- Dashboard row initialization uses `onConflictDoNothing`.
- Pino logging redacts auth headers and cookies.
- The pages are clean and readable, the responsive grid works, and loading skeletons and empty states are handled.

---

## Step 2 notes (done)
Removed: the mockup sandbox, the `scripts/` package (including the auto schema push, 2.9), 45 UI components, `use-mobile`, the tooltip provider, 41 packages, Replit config/plugins/remote, `opengraph.jpg`, unused theme CSS (CSS bundle 101 KB → 38 KB), `cookie-parser`, `express.urlencoded`, and the 80-entry build externals list. `index.html` is now `noindex` and pinch-zoom works again. The 404 page has user-facing text. The dev server binds to localhost unless `HOST=0.0.0.0` is set.

Kept on purpose:
- Replit's `hover-elevate` CSS, because Button and Badge use it for hover feedback. Restyling belongs with the UI work.
- `custom-fetch.ts` helpers, which may be useful for a native client.
- The server-side catalog filters.
- The orange-square `favicon.svg` placeholder (it needs a real icon).

## Step 3 notes (done)
Fixed 2.1, 2.2, 2.6, 2.7, and 2.8, and verified each in a browser against a throwaway Postgres.
- Saves now write the record into its own cache entry and refresh the list and dashboard.
- Screen time converts through `src/lib/screen-time.ts`, which round-trips every whole minute exactly. The old code changed 1,200 of the 1,441 values in a day (0–1440 minutes) on save.
- The dashboard keeps the new status on screen until fresh data arrives, and shows a toast on failure.

Found during testing: React Query pauses retries while the tab is unfocused, and the forms then rendered an **empty edit form** for a record that hadn't loaded. Fixes:
- Edit forms now render only after the record loads.
- 4xx responses are no longer retried (global `retry` in `App.tsx`; `ApiError` is now exported from `@workspace/api-client-react`).

## Step 4 notes (done)
- `openapi.yaml` now defines enums for interest tags, categories, cost, ads, catalog status, and install status, plus ranges (age 1–17, app ages 0–17, screen time 0–1440 minutes), a URL format, and positive integer IDs.
- Every route parses its params, query, and body with the generated schemas (`src/lib/http.ts`). PUT requires full bodies. Catalog filtering moved into SQL. `ageMin <= ageMax` is checked on the server.
- Errors are JSON 400/404/500, and 500s never leak internals.
- The status write is one `INSERT … ON CONFLICT DO UPDATE`; a missing child or app returns 404.
- The DELETE endpoints are removed from the spec and the server.
- Verified with 30 request checks plus a database-outage test against a throwaway Postgres.

Found during this step:
- 🔴→✅ **A database blip crashed the API.** `pg.Pool` had no `error` listener, so a dropped idle connection killed the process. A listener was added in `lib/db`. The API now returns 500 while the DB is down and recovers on its own.
- ✅ `includeRemoved=false` would have been read as `true` (`z.coerce.boolean()`); the route reads the raw string instead.
- ✅ Orval ignores `type: integer`, so integers use `multipleOf: 1` to get enforced.
- ✅ Removed a Next.js `"use client"` directive from `label.tsx` that caused a build warning.
- Still open (step 6): the DB columns for category, cost, ads, and status are free text, so only the API enforces the enums. Moving them into DB enums or check constraints needs a reviewed migration.

## Step 5 notes (done)
- **One source for option lists.** `src/lib/catalog.ts` builds the interest, category, cost, ad, and status lists from the enums generated from `openapi.yaml`, and holds the shared badge colors. The page-local copies are gone.
- **Shared form pieces** in `src/components/form-field.tsx` (`FormField`, `ToggleChip` with `aria-pressed`, `toggled`).
- **One matching rule.** `api-server/src/lib/matching.ts` (`appMatchesChild`). The dashboard no longer rebuilds responses field by field, and it sorts children by ID like the Children page.
- **No more `<button>` inside `<a>`.** Six places now use `Button asChild`.
- **One Zod version.** The unused `drizzle-zod`/`zod/v4` insert schemas were removed from `lib/db`, along with the risky `push-force` script.
- **Stricter TypeScript.** `tsconfig.base.json` has `strict`, `noUnusedLocals`, and `noUnusedParameters`. This caught one unused import.
- **Catalog page** no longer shows "No apps match" next to the error banner.
- **API `dev`** now uses `tsx watch` (reloads on save) instead of build-then-start.

Found during browser testing: tag toggles read the tag list captured at render time, so two clicks before a re-render lost the first one. They now read the live value with `getValues`. Verified in a browser: rapid double clicks save both tags, filters, and links. The API checks still pass 30/30.

## Step 6 notes (done)
There was no live data to preserve, so this is a clean baseline (`lib/db/migrations/0000_baseline.sql`) rather than a data migration.
- **Postgres enums** for interest tags, category, cost model, ad status, catalog status, and install status. The legacy `Blocked`/`Limited` values are dropped. A compile-time contract (`api-server/src/lib/contract.ts`) ties them to the OpenAPI enums; a deliberate mismatch was tested and failed the typecheck.
- `children.interests` is now `interest_tag[]`, the same type as `apps.interest_tags` (it used to be `jsonb`).
- **Check constraints:** child age 1–17, screen time 0–1440, app ages 0–17, `age_min <= age_max`. The unique pair is a real UNIQUE constraint (the constraint-vs-index mismatch is gone). There's an index on `child_app_status.app_id`.
- Timestamps are `timestamptz`, and `updated_at` updates automatically (also on upserts, verified in Drizzle's source and at runtime).
- **Versioned migrations** (`generate`/`migrate`) replace `drizzle-kit push`.
- **Seed corrections:** GarageBand ages 3–17, Aqua's real listing (ages 5–12), Toca Boca Jr is a Subscription, Endless Alphabet is a One-time purchase with the right listing ID. The placeholder children are clearly fake and cover ages 3/6/9. The seed closes its pool and reports failures through the exit code.
- Verified on a fresh database: migrate (and re-migrate as a no-op), seed twice (13 inserted, then 13 skipped), and 7 direct-SQL bad inserts all rejected by the database. The API checks still pass 30/30.

Still a product decision, not a bug: `lastVerified` is set on every save, so it means "last edited."

## Step 7 notes (done)
`pnpm test` runs 41 tests in about 3 seconds, with no database to install:
- **API (`artifacts/api-server/test/api.test.ts`, 26 tests):** the real Express app against an in-memory Postgres (PGlite) with the committed migrations applied. Covers CRUD, full-replacement PUT, every validation case, soft delete and restore, SQL filters, no DELETE routes, the per-child upsert (including 5 simultaneous writes), sibling independence, dashboard matching and row initialization, export contents, and JSON errors.
- **Database (`test/db-constraints.test.ts`):** raw SQL that skips the API and is rejected by the enums, check constraints, unique pair, and foreign keys.
- **Units:** the matching rule (inclusive ages, shared tags, Games ≠ Gaming), the screen-time round trip for every minute of a day, `toggled`, and the option lists.
- **The suite catches regressions:** an age off-by-one and the `coerce.boolean` bug were planted on purpose, and both failed at the unit and API levels.

Found while adding tests: PGlite as a dev dependency made pnpm install a second `drizzle-orm` (via its optional peer), which broke typechecking across packages. The API now imports drizzle operators and `migrate()` from `@workspace/db`, so there's one instance.

Not automated yet: frontend behavior that needs a browser (Arcade hiding, optimistic rollback, layout). Those were verified by hand in steps 3–5. Browser tests (e.g. Playwright) would be the next layer.

## Proposed cleanup order

Each step is a separate, reviewable change.

1. ✅ **Make it run locally:** fix the workspace overrides and lockfile (1.1) and add the Vite `/api` proxy (1.2). Without this nothing else can be tested.
2. ✅ **Remove Replit leftovers and bloat** (§4, §5): mockup sandbox, unused UI and packages, Replit config and plugins, `index.html` placeholders, `noindex`. Pure deletion; verified by typecheck, build, and clicking through.
3. ✅ **Fix the data-loss and drift bugs** (2.1, 2.2, 2.6, 2.7, 2.8): frontend only.
4. ✅ **Harden the API** (2.3, 2.4, 2.5): enums in the spec, validation with the generated schemas, a JSON error handler, an atomic upsert, removed or replaced DELETEs.
5. ✅ **Consolidate** (§6): shared constants from the spec, one matching function, the `<Link>`/`<Button>` fix, one Zod version.
6. ✅ **Data:** correct the seed entries (§3), and plan the DB fixes (interests type, legacy enum values, constraint vs. index) as a reviewed migration against a backup.
7. ✅ **Tests:** turn HANDOFF §17 into automated checks.
