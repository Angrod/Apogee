# Apogee — How to Use and Build This Tool

This guide describes the original product intent and the current source-code implementation. It is a handoff document, not a claim that every feature has been tested again or that the starter catalog's App Store information is currently accurate. No live database records were queried to prepare this guide.

The original Stage 1 brief is preserved in [original-brief.md](original-brief.md).

## 1. What Apogee is

Apogee is a personal family app-management tool for a parent curating apps for three children's iPads. Its purpose is to replace scattered app recommendations, installation reminders, and notes with one organized place.

The parent:

- Maintains each child's age, interests, device label, and screen-time goals.
- Creates and maintains a catalog of apps they have reviewed.
- Sees which active catalog apps match each child's age and interests.
- Tracks whether each matched app is not installed, planned for installation, installed, or removed.
- Keeps notes and catalog records instead of discarding information about rejected apps.
- Exports family and catalog data as JSON.

The original intent was personal/family use now, with a clean foundation for a possible commercial product later. It is not currently a commercial service or a device-management system.

### The most important distinction

**Apogee records the parent's decisions. It does not control the iPads.**

"Push" means "mark this app as Pushed in Apogee." It does not send a command to Apple, install an app, purchase anything, notify the device, or confirm installation. The parent still performs the actual installation.

Likewise, screen-time goals are stored preferences. Apogee does not read actual usage or enforce limits.

## 2. Original requirements and deliberate limits

The original brief requested:

- A React frontend and a simple Node/Express backend.
- SQLite initially, with an ORM so PostgreSQL could be adopted later.
- No authentication at this stage.
- A mobile-responsive web app, because the parent expects to use it from a phone.
- Real database seed rows, not frontend-only starter records.
- Status tracking per child and per app through a junction table.
- Catalog soft deletion using an Active/Removed flag.
- An automatically updated last-verified date.
- A three-child dashboard with recommendations grouped by installation status.
- JSON export, with no import required yet.
- A warm, approachable interface rather than a default enterprise dashboard.

The brief explicitly excluded:

- Login and account management.
- Real MDM, remote installation, and device push.
- A native mobile app.
- Billing and subscription management.
- Multi-family support.
- Homework, Educational, or Free Play modes requiring device enforcement.
- Real Apple Arcade or Epic catalog integration.

The current implementation uses **PostgreSQL and Drizzle, not SQLite**. The reason for that change is not documented in the original brief. Treat PostgreSQL as a current dependency; switching to SQLite would require a deliberate migration, not a connection-string change.

### Working agreement for future development

The parent asked for incremental work and review between major sections. The later instruction was stronger: after completing a task, end the turn and wait for a new message explicitly approving the next task. Do not silently continue through a multi-task roadmap.

## 3. How the product is organized

| Section   | Purpose                                                            |
| --------- | ------------------------------------------------------------------ |
| Dashboard | Review recommendations and change each child's installation status. |
| Children  | Add and edit child profiles.                                       |
| Catalog   | Maintain the shared collection of reviewed apps.                   |

The navigation also contains **Export Data**.

### Current page routes

| Route           | Page           |
| --------------- | -------------- |
| `/`             | Dashboard      |
| `/children`     | Child profiles |
| `/children/new` | Add child      |
| `/children/:id` | Edit child     |
| `/catalog`      | App catalog    |
| `/catalog/new`  | Add app        |
| `/catalog/:id`  | Edit app       |

The dashboard has one column at narrow widths, two at medium widths, and three at large widths. More profiles can technically be added; there is no three-child database limit. However, the intended product scope is one family, not multiple households.

## 4. Setting up child profiles

Open **Children**, then add or edit a profile.

| Field                    | Meaning                                                      |
| ------------------------ | ------------------------------------------------------------ |
| Name                     | A display name for the child.                                |
| Age                      | A manually maintained whole-number age; the form accepts 1–17. |
| Interests                | Zero or more tags used in matching recommendations.          |
| Device name              | A label such as "Child's iPad," not a discovered or paired device. |
| Weekday screen-time goal | Hours per weekday, entered by the parent.                    |
| Weekend screen-time goal | Hours per weekend day, entered by the parent.                |
| Apple Arcade             | A manually maintained access flag.                           |

Interest choices: Engineering, Baking/Food, Music, Drawing, Reading, Math, Science, Gaming, Language Learning.

Age does not advance automatically: there is no birthdate field or birthday calculation. Update ages as children grow.

The form accepts screen time in hours, but the database and API store it in **minutes**. For example, 1.5 hours becomes 90 minutes. Existing values are displayed rounded to one decimal place in the editing form, so unusual minute values can lose precision when saved.

### Starter profiles

The seed script defines these initial profiles. These are source-code defaults, not a verification of the live database or of the family's real details.

| Profile | Age | Interests                          | Weekday goal | Weekend goal | Arcade |
| ------- | --- | ---------------------------------- | ------------ | ------------ | ------ |
| Olivia  | 8   | Drawing, Reading, Music            | 1.5 hours    | 2 hours      | Off    |
| Marcus  | 11  | Engineering, Gaming, Math, Science | 2 hours      | 3 hours      | On     |
| Zoe     | 6   | Reading, Baking/Food, Music        | 1 hour       | 1.5 hours    | Off    |

Device labels are each child's name followed by "'s iPad." Edit these defaults to match the actual household.

## 5. Maintaining the app catalog

The catalog is shared across all children. A catalog record describes an app; it does not describe whether a particular child has it installed.

### Adding an app

1. Open **Catalog** and choose **Add App**.
2. Enter its name and App Store URL.
3. Select a category.
4. Enter the minimum and maximum appropriate ages.
5. Select relevant interest tags.
6. Choose its cost model and ad status.
7. Write notes explaining why you selected it, what to watch for, or why it was rejected.
8. Choose Active or Removed.
9. Save.

- **Categories:** Games, Education, Creative, Music, Reading
- **Cost models:** Free, One-time purchase, Subscription
- **Ad labels:** No Ads, Minimal, Has Ads

The catalog supports category and interest-tag filters and a *show removed* toggle. It does not currently provide a text-search field.

### Editing and verification dates

On every create or edit, the backend sets `lastVerified` to its current UTC date.

This is a save-date marker, not proof of an automated review. Even a spelling correction updates it. There is no automatic App Store check, re-verification reminder, overdue threshold, historical audit, or manual last-verified-date input.

If the date should mean "I checked this app today," establish that as a manual practice: review the app's availability, price, ads, and suitability before saving.

### Removing an app from the catalog

Set its catalog status to **Removed** and save. This retains the record and notes, hides it from the normal catalog view, and excludes it from recommendations for every child.

To restore: enable *show removed*, open its edit page, change the status to Active, and save.

> **Implementation gap:** the backend also exposes `DELETE /api/apps/:id`, which attempts a permanent database deletion. This does not implement the intended soft-delete policy. Do not use it for normal removal. It may also fail when related child-status rows exist, because those relationships have foreign keys.

## 6. How matching works

An app matches a child only when all three conditions are true:

1. The app's catalog status is Active.
2. The child's age is inside the app's inclusive min/max age range.
3. The app and child share at least one interest tag.

```
active
AND ageMin <= child.age <= ageMax
AND at least one app interest tag appears in the child's interests
```

This is deterministic filtering, not AI. There is no ranking model, recommendation score, online discovery, usage-based personalization, cost budget, or ad-based exclusion.

### Practical consequences

- A child with no interests will have no matched apps.
- An app with no interest tags will match no children.
- Exact tag values matter.
- Category and interest are different concepts. "Games" is a category; "Gaming" is an interest.
- An app can be called a game but be categorized as Education; Arcade filtering operates on the category field.
- Changing age, interests, app tags, or catalog status changes what appears.
- Older installation-status rows remain stored even when the app no longer matches.
- The dashboard is therefore not a complete inventory of everything installed on a child's iPad. An installed app can disappear from this view when it stops matching.
- App and child saves invalidate their respective list caches, but do not explicitly invalidate the dashboard cache (30-second stale time). If a recent edit is not reflected after navigation, refresh the page.

## 7. Using the dashboard and statuses

For each child, the dashboard displays matched apps in groups ordered **Pushed → Installed → Not Installed**.

App cards show the app name, cost label, App Store link, status dropdown, and a Push action when the current status is not already Pushed.

| Status        | Intended meaning                                                       |
| ------------- | ---------------------------------------------------------------------- |
| Not Installed | A matching app that has not been marked for installation or installed. |
| Pushed        | The parent has marked it for installation; the device has not been contacted. |
| Installed     | The parent has confirmed installation manually.                        |
| Removed       | The parent has marked it removed for that child.                       |

The dropdown can change status in any direction. There is no enforced workflow or history log.

Changes appear immediately (optimistic update). The card is disabled while its request is in flight. A successful request refreshes dashboard data; a failed request restores the previous local status, but no explanatory toast is shown.

### Two different "Removed" settings

- **Catalog Removed:** the shared app is no longer recommended to anyone.
- **Child-app Removed:** the shared app remains Active, but its status is Removed for one particular child.

These are independent. Removing an app for one child does not remove it for siblings.

### Recovery limitation

Child-app records marked Removed are hidden from the dashboard. There is no "show removed for this child" control, so the parent cannot restore that pair through the UI once its card disappears. A developer can restore it through `PUT /api/child-app-status/:childId/:appId`.

### Status initialization

Opening the dashboard creates missing status rows for matched child/app pairs, initially Not Installed. `GET /api/dashboard` therefore has a database-write side effect.

## 8. Apple Arcade behavior

Apple Arcade is a profile boolean, not an integration. When enabled:

- The profile's dashboard header shows an Arcade badge.
- Matched apps whose category is exactly **Games** are hidden for that child.
- A "Games via Apple Arcade" note appears when at least one matched catalog app is in Games.

Education, Creative, Music, and Reading apps are not hidden. There is no subscription verification, Arcade catalog browsing, entitlement lookup, or Epic integration. If no matched app has category Games, the note may not appear even though the badge does.

## 9. A practical weekly workflow

1. Review child profiles and update ages, interests, device labels, and goals.
2. Add newly discovered apps to the catalog after checking their real App Store listings.
3. Check recommendations on the dashboard.
4. Mark selected apps Pushed as an installation task list.
5. Open the App Store link and install the app manually on the relevant iPad.
6. Return to Apogee and mark it Installed.
7. Configure any real screen-time restrictions separately on the device.
8. If abandoning an app globally, keep the reason in notes and mark its catalog record Removed.
9. Export data periodically, especially before moving or modifying the project.

## 10. Exporting and recovering data

**Export Data** downloads `apogee-export-YYYY-MM-DD.json`:

```json
{
  "children": [],
  "apps": [],
  "childAppStatuses": []
}
```

The arrays contain full records including IDs and timestamps, catalog Removed records, and all stored child-status rows.

The export is a portable data snapshot. It is **not** source code, not a PostgreSQL backup (no schema, indexes, enums, or migration history), not encrypted, and not transactional (tables are read separately). There is no import button. It contains family information and must be stored privately.

## 11. Starter catalog and its verification limits

| App                         | Category  | Ages | Cost model        |
| --------------------------- | --------- | ---- | ----------------- |
| Khan Academy Kids           | Education | 2–8  | Free              |
| GarageBand                  | Music     | 6–17 | Free              |
| Aqua by Adobe               | Creative  | 8–17 | Free              |
| Cargo-Bot                   | Education | 7–14 | Free              |
| Duolingo ABC                | Reading   | 3–6  | Free              |
| PBS Kids Games              | Education | 2–8  | Free              |
| Toca Boca Jr                | Games     | 2–6  | Free              |
| Simple Machines by Tinybop  | Education | 4–10 | One-time purchase |
| Sketchbook                  | Creative  | 6–17 | Free              |
| Endless Alphabet            | Reading   | 2–6  | Free              |

All ten are seeded as Active and No Ads. These are starter metadata choices, not verified claims about availability, pricing, ads, or suitability.

"Aqua by Adobe" is the name from the original brief, but its stored URL points to an Adobe Photoshop Sketch listing. The name/link identity needs manual review.

The seed script skips existing app and child names. It does not overwrite or update records and is not a sync/migration mechanism. Renamed entries can cause additional starter rows on a later seed run.

## 12. Technical architecture

pnpm workspace with a frontend, API server, and shared libraries.

| Layer                      | Implementation                        |
| -------------------------- | ------------------------------------- |
| Frontend                   | React, TypeScript, Vite               |
| Styling/components         | Tailwind CSS and shared UI components |
| Routing                    | Wouter                                |
| Server-state caching       | TanStack React Query                  |
| Forms                      | React Hook Form with Zod validation   |
| API                        | Express 5                             |
| Database                   | PostgreSQL with Drizzle ORM           |
| API contract               | OpenAPI                               |
| Generated clients/schemas  | Orval                                 |
| Backend build              | esbuild                               |
| Runtime                    | Node.js 24                            |

### Repository map

```
artifacts/
  apogee/             Main React app
  api-server/         Express API
  mockup-sandbox/     Separate design-preview workspace (not required by the app)
lib/
  db/                 Database schema, connection, seed script
  api-spec/           OpenAPI contract and codegen configuration
  api-client-react/   Generated client, hooks, shared fetch helper
  api-zod/            Generated validation schemas
scripts/              Workspace utility scripts
docs/                 This guide and the original brief
```

### Database tables

- **children** — name, age, JSON interests, device name, weekday/weekend minutes, Arcade access, timestamps.
- **apps** — name, App Store URL, category, age range, interest-tag array, cost model, ad status, notes, last-verified date, Active/Removed status, timestamps.
- **child_app_status** — child FK, app FK, current installation status, timestamps.

The relationship must remain per child/per app. A single status on the shared `apps` table cannot represent different siblings' installations.

### Uniqueness and concurrency

A prior change applied a database UNIQUE constraint on `(child_id, app_id)`. The source schema declares a unique *index* with the same name, `child_app_status_child_id_app_id_unique`. These are not identical schema objects — inspect migration diffs before syncing an existing database.

Dashboard initialization uses conflict-ignore inserts. The status-update endpoint still does select-then-insert/update rather than an atomic upsert, so two simultaneous first writes can produce a failed request (duplicates are still prevented).

The DB enum also retains legacy `Blocked` and `Limited` values. The UI exposes only Not Installed, Pushed, Installed, and Removed, and maps unknown statuses to Not Installed for display.

## 13. API reference

| Method & path                              | Purpose                                         |
| ------------------------------------------ | ----------------------------------------------- |
| `GET /api/healthz`                         | Health check                                    |
| `GET /api/children`                        | List profiles                                   |
| `POST /api/children`                       | Create profile                                  |
| `GET /api/children/:id`                    | Read profile                                    |
| `PUT /api/children/:id`                    | Update profile                                  |
| `DELETE /api/children/:id`                 | Attempt permanent profile deletion              |
| `GET /api/apps`                            | List catalog (`includeRemoved=true`, `category`, `interestTag`) |
| `POST /api/apps`                           | Create app                                      |
| `GET /api/apps/:id`                        | Read app                                        |
| `PUT /api/apps/:id`                        | Update app                                      |
| `DELETE /api/apps/:id`                     | Permanent delete — **not** the intended soft-delete flow |
| `GET /api/dashboard`                       | Match apps and initialize missing status rows   |
| `PUT /api/child-app-status/:childId/:appId`| Set status for one pair, body `{ "status": "Installed" }` |
| `GET /api/export`                          | Export all three collections                    |

Update handlers replace fields and default some omitted values — they are not safe partial updates. Send a complete payload.

Generated Zod schemas exist, but route handlers largely use `req.body` directly. Frontend validation does not protect the API from invalid direct requests.

## 14. Running and building

### Prerequisites

- Node.js 24, pnpm, PostgreSQL
- `DATABASE_URL` set in the environment (never committed)

### Install

```sh
pnpm install --frozen-lockfile
```

Use pnpm only; the root `preinstall` rejects npm/Yarn.

### Initialize a fresh development database

```sh
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run seed
```

Only run against a disposable/dev database after reviewing the target. Do not force-push schemas against valuable data. There is no committed, versioned migration history covering prior live database changes.

### Running locally

There is no root `dev` script. Run the API and frontend separately:

```sh
# Terminal 1: API
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2: frontend
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/apogee run dev
```

The browser calls `/api/...` on the frontend origin. In Replit, the platform router handled this. Locally, the Vite dev server now proxies `/api` to `API_URL` (default `http://localhost:8080`). In production you still need a reverse proxy so that:

```
/api/*  -> Express API (preserving the /api prefix)
/*      -> React frontend
```

Production also needs SPA fallback to `index.html` for client routes.

### Type checking and code generation

```sh
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
```

The contract is `lib/api-spec/openapi.yaml`. Change it before changing the API, then regenerate. Do not hand-edit generated files. Keep the OpenAPI title stable — it affects generated filenames.

### Production builds

```sh
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/apogee run build   # -> artifacts/apogee/dist/public
pnpm --filter @workspace/api-server run build                      # -> artifacts/api-server/dist/index.mjs
PORT=8080 NODE_ENV=production node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Hosting must also supply the database, environment variables, routing, process lifecycle, and access protection.

## 15. Security and commercial-readiness limits

There is no authentication, ownership check, or family separation, and CORS is permissive. **Do not expose this app and API publicly with real family data without access protection.**

Commercial readiness would require:

- Authentication and authorization.
- A family/household ownership model on every relevant record.
- Server-side request validation and consistent error handling.
- Safe deletion and restoration policies.
- Atomic writes and tested concurrency behavior.
- Versioned database migrations and backup/restore procedures.
- Verified app metadata and privacy/compliance review.
- Operational monitoring and a secure deployment configuration.
- Billing only if it becomes an explicitly approved requirement.

## 16. Work completed and work still open

### Implemented

- Persistent child, app, and child-app status tables, seeded via script.
- Child and catalog create/edit; catalog filtering and Active/Removed status.
- Age/interest matching; responsive per-child dashboard.
- Manual Push and status updates; Arcade display/filter flag.
- JSON export; pair-uniqueness protection.

### Known gaps worth prioritizing

- Make the backend deletion policy match catalog soft deletion.
- Add a parent-facing way to view and restore child-app Removed records.
- Validate bodies, route IDs, allowed values, and relationships on the server.
- Use an atomic upsert for status writes.
- Invalidate dashboard data after catalog/profile changes.
- Verify all starter App Store identities, links, prices, and ad labels.
- Establish reviewed, versioned migrations, including the uniqueness-object difference.
- Add a local-development routing setup (Vite proxy).
- Improve small-screen navigation if the nav crowds narrow phones.
- Add explicit feedback for failed status changes.

### Ideas discussed but not built (not approved)

- A native/mobile companion app.
- Auto-filling catalog details from an App Store URL.
- Displaying screen-time goals alongside each child's app list.

## 17. Acceptance checks for future changes

- Add/edit a child; confirm changes survive refresh.
- Enter 1.5 weekday hours; confirm storage/export uses 90 minutes.
- Toggle Arcade; confirm only exact Games-category matches are hidden.
- Add an age-appropriate app with a shared tag; confirm it matches the expected child.
- Test an age boundary and an app/child with no shared interests.
- Change one child's app status; confirm siblings are unchanged.
- Refresh after a status change; confirm persistence.
- Simulate a failed write; confirm the old status is restored.
- Remove a catalog app; confirm its record and notes remain and recommendations exclude it.
- Restore the catalog app; confirm matching resumes.
- Check child-app removal/restoration once a restoration UI exists.
- Export; verify all three arrays, removed records, and matching IDs.
- Confirm the ten starter apps are actual database rows.
- Test narrow-screen navigation and the three-column desktop view.
- Verify unauthenticated access is blocked before exposing real data publicly.
- Inspect migration plans on a backup or disposable database before applying them to valuable data.

## 18. Rules for continuing the build

- Preserve the distinction between the shared catalog and per-child installation state.
- Preserve records and notes when removing catalog apps.
- Never present status tracking as actual installation, usage measurement, or enforcement.
- Keep the app useful on a phone.
- Keep database records authoritative; no hardcoded demo data.
- Use the OpenAPI contract and regenerate clients after contract changes.
- Protect credentials and family data during exports, hosting, and transfer.
- Work on one explicitly approved task at a time; finish it, report actual results and limits, then wait for explicit approval of the next task.

The guiding purpose: help a parent make informed app choices and keep a reliable record of those choices for each child, without pretending to manage devices that Apogee does not actually control.
