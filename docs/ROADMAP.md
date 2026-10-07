# Roadmap

What's being worked on, what's next, and what's waiting on someone outside the code. Decisions and their reasoning are in [DECISIONS.md](DECISIONS.md).

_Last updated: 2026-10-07_

## Now
**Undo and removal are done** (per-child Removed group, archived child profiles). **Local setup is done** (Homebrew Postgres 18, `.env`, `pnpm dev`). **Cleanup is complete.** All 7 steps of [AUDIT.md](AUDIT.md) are done: it builds on macOS, the bloat is removed, the bugs are fixed, the API and DB are hardened, migrations are versioned, and `pnpm test` runs the suite. Pick the next item below.

## Next (in order, each needs approval before starting)
1. **Authentication.** Required before anything leaves the local network or a native app talks to the API.
2. **Screen Time app spike.** A minimal native iOS app using FamilyControls, built as a development build on one of this household's iPads. It proves authorization, blocking one app, and a downtime schedule.
3. **Connect Apogee to the Screen Time app.** The native app reads the child's profile and catalog from the Apogee API.
4. **Smarter App Store flow.** An App Store ID per catalog app, deep links, and a "requested by kid" state.

## Waiting on things outside the code (can run in parallel)
- [ ] Apple Developer account activation (Individual).
- [ ] **Ask Apple** whether consumer/family MDM is allowed: a shared push certificate, and licenses on other households' devices ([DECISIONS.md §1](DECISIONS.md#1-decision-2026-10-06), path 4).
- [ ] **Decide bundle ID naming** before any Family Controls distribution request. Each bundle ID needs its own request.
- [ ] Family Controls distribution request. Only needed for TestFlight/App Store, not for development builds.

## Later / parked
- LLC + D-U-N-S + ABM: only for this household's MDM.
- NanoMDM for this household (after the LLC).
- Supervision (requires wiping the iPads): unlocks real OS update deferral, App Store lockdown, and silent installs.
- Product ideas: approval modes (Open / Notify / Approve), Arcade/Epic/Khan category toggles, Homework/Educational modes, birthday age-bump, a 90-day "needs check" badge on stale catalog entries (from the Bolt reference build), config drift alerts.
