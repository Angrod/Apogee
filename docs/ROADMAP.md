# Roadmap

**Status (2026-10-09):** Everything is on `main` and pushed. The web app runs locally (`pnpm dev`) against Homebrew Postgres, and all 43 tests pass (`pnpm test`). It still only *records* decisions: nothing is installed on or controlled from an iPad yet, and there's no login, so keep it on your own network.

Decisions and their reasoning are in [DECISIONS.md](DECISIONS.md); the cleanup findings are in [AUDIT.md](AUDIT.md).

## To do

### 1. Use it with real data
- [ ] `pnpm dev`, open http://localhost:3000
- [ ] Add each child's real profile (age, interests, device, screen-time goals, Arcade)
- [ ] Review the 10 starter apps; add apps you actually use; mark rejected ones Removed with a note
- [ ] Track installs on the dashboard for a few days
- [ ] Write down what feels missing or clunky; that list reorders everything below

### 2. Apple items (outside the code; start early, they wait on Apple)
- [ ] Confirm the Apple Developer account (Individual) is active
- [ ] Ask Apple Developer Support whether family/consumer MDM is allowed: a shared push certificate, and app licenses on other households' devices ([DECISIONS.md §1](DECISIONS.md#1-decision-2026-10-06), path 4)
- [ ] Decide bundle ID naming (e.g. `com.<you>.familyapp`); needed before any Family Controls distribution request, one per bundle ID
- [ ] Later: the Family Controls distribution request (only for TestFlight/App Store, not for testing on your own iPads)

### 3. Authentication
Required before anything leaves your Mac or a native app talks to the API.
- [ ] Decide: who logs in (just you, or both parents)?
- [ ] Decide: do the kids ever sign in?
- [ ] Decide: is a simple password enough for now?
- [ ] Build it, with tests; lock down CORS

### 4. Screen Time app spike
A minimal native iOS app using FamilyControls / ManagedSettings / DeviceActivity, installed as a development build on one iPad. No wipe, no MDM.
- [ ] Parent authorizes Screen Time access on the child's iPad
- [ ] Block one app from code
- [ ] Apply a downtime schedule
- [ ] Note what Apple allows and what it doesn't

### 5. Connect Apogee to the Screen Time app
- [ ] The native app signs in and reads its child's profile and catalog from the API
- [ ] Decide what the parent controls from the web app vs. on the device

### 6. Smarter App Store flow
- [ ] App Store ID per catalog app (parsed from the URL)
- [ ] Deep links straight to each listing
- [ ] A "requested by kid" state

### 7. Small decisions
- [ ] "Last verified" changes on every save (it means "last edited"). Keep it, or add a "Mark verified" button?
- [ ] 90-day "needs check" badge on stale catalog apps (idea from the Bolt build; depends on the decision above)

### Later / parked
- LLC + D-U-N-S + Apple Business Manager: only needed for this household's MDM
- NanoMDM for this household (after the LLC)
- Supervision (wipes the iPads): real OS update deferral, App Store lockdown, silent installs
- Product ideas: approval modes (Open / Notify / Approve), Arcade/Epic/Khan category toggles, Homework/Educational modes, birthday age bump, config drift alerts
- Browser tests (e.g. Playwright) for the frontend-only behavior

## Done

**Features after the cleanup**
- `f9afe9e` Undo and removal: per-child "Removed" group on the dashboard, archived child profiles
- `4977cdd` Local development: Homebrew Postgres 18, `.env`, `pnpm dev`, catalog-only seed by default

**Code cleanup** (all 7 steps of [AUDIT.md](AUDIT.md))
- `4aa01ee` Step 7: automated tests (API against in-memory Postgres, DB constraints, units)
- `d0666d6` Step 6: DB enums and check constraints, versioned migrations, corrected seed data
- `a39c4e2` Step 5: shared constants and form pieces, one matching rule, stricter TypeScript
- `51036be` Step 4: API validation, JSON errors, atomic status upsert, no hard deletes, DB-crash fix
- `d468cda` Step 3: frontend data-loss and screen-time drift bugs
- `173373e` Step 2: removed Replit template bloat (~14,800 lines)
- `ff40add` Step 1: builds and runs on macOS, `/api` dev proxy
- `8ef1524` Code audit of the Replit build

**Direction and docs**
- `a8b1eca` Docs reorganized: DECISIONS.md, ROADMAP.md, CLAUDE.md
- `9446c78` Device-control decision: App Store + Screen Time API first, MDM pending Apple
- `0e7ed6c` Device-control feasibility research
- `07148fb` Product direction: Apogee as an MDM for parents
- `4120890` Moved off Replit: README, CLAUDE.md, handoff docs

**Stage 1 (built on Replit, June 2026)**
- `a6d72d2` Unique constraint on child/app status
- `3db8790` Dashboard and data export
- `963c8c4` App catalog
- `bb6efc6` Child profiles
- `882d766` Foundation and schema
