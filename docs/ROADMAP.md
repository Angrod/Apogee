# Roadmap

What's being worked on, what's next, and what's waiting on someone outside the code. Decisions and their reasoning are in [DECISIONS.md](DECISIONS.md).

_Last updated: 2026-10-07_

## Now
**Code cleanup.** The audit is done: see [AUDIT.md](AUDIT.md). Next is working through its 7-step cleanup order, one approved step at a time. Steps 1–2 (build on macOS, remove bloat and Replit leftovers) are done. Next is step 3, fixing the frontend data-loss and drift bugs.

## Next (in order, each needs approval before starting)
1. **Local Postgres** so the app runs fully off Replit (the proxy and build fixes are in the cleanup).
2. **Remaining handoff gaps** not covered by the cleanup ([HANDOFF.md §16](HANDOFF.md#16-work-completed-and-work-still-open)): soft-delete-only API, server-side validation, an atomic status upsert, dashboard cache invalidation, and a way to restore child-app "Removed" rows.
3. **Authentication.** Required before anything leaves the local network or a native app talks to the API.
4. **Screen Time app spike.** A minimal native iOS app using FamilyControls, built as a development build on one of this household's iPads. It proves authorization, blocking one app, and a downtime schedule.
5. **Connect Apogee to the Screen Time app.** The native app reads the child's profile and catalog from the Apogee API.
6. **Smarter App Store flow.** An App Store ID per catalog app, deep links, and a "requested by kid" state.

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
