# Device Control: Feasibility and Direction

Status: research spike, researched 2026-10-06. No code yet. This document decides how Apogee goes from *recording* decisions to *acting* on the kids' iPads.

## 1. Why: the pain points

Setting up three iPads (ages 3, 5, 7) felt like onboarding new users. That part was easy. Keeping the devices managed afterward is what's hard:

- **App requests take too many steps.** The kid wants an app. It gets downloaded on their iPad, Ask to Buy texts the parent, and the parent approves. All of that for one app is why many parents give up and allow everything.
- **OS updates are all-or-nothing.** Auto-install is fine most of the time, but the parent wants to hold back `.0` releases and has no clean way to do that.
- More cases will come up. The general problem is that Apple's family tools put every decision in front of the parent as a separate interruption, with no standing policy.

### Product requirements
1. **Self-service from the catalog.** A kid taps an app that's in the shared catalog and it installs with no parent approval. Apps not in the catalog still need a parent decision.
2. **OS update policy.** Updates install automatically by default. The parent can hold back major `.0` releases for N days.
3. **Real state.** "Installed" should come from the device's inventory, not from manual bookkeeping.
4. **No wipe for now.** The iPads stay unsupervised, and supervision may come later.

## 2. What Apple allows (verified)

| Need | Unsupervised + MDM | Supervised | Source |
|---|---|---|---|
| Install App Store app, no Apple ID / Ask to Buy | **Yes**, *if* the app license comes from Apple Business Manager (ABM) and is assigned to the device. The user sees an "Allow install?" prompt but isn't asked for an Apple ID | Fully silent | [Apple: content distribution](https://support.apple.com/guide/deployment/dep7cef2e0ea/web), [ManageEngine](https://manageengine.com/mobile-device-management-msp/how-to/silent-installation-ios-apps.html) |
| Install app *without* ABM licenses | Goes through the device's Apple ID, so Ask to Buy still applies | Same | as above |
| Hide the App Store / block installs outside the catalog | No | Yes ("Install apps using App Store" restriction) | [Apple: restrictions](https://support.apple.com/guide/deployment/dep0f7dd3d8/web) |
| **Defer OS updates 1–90 days** (the "no `.0`" policy) | No | Yes: Software Update *settings* declaration, iOS/iPadOS 18+ | [Apple: SU settings](https://support.apple.com/guide/deployment/dep0578d8b8a/web) |
| Force an update to a specific version by a deadline | **Yes**: Software Update *enforcement* declaration, iOS 17+, no supervision needed | Yes | [Apple: SU enforcement](https://support.apple.com/guide/deployment/depca14ecd4d/web) |
| Inventory (installed apps, OS version) | Yes | Yes | MDM protocol |
| Remove MDM-installed apps | Yes | Yes | MDM protocol |

Some notes on the table:
- Unsupervised, the "skip `.0`" policy can be partly built: leave auto-update **off** on the iPad, and Apogee pushes enforcement for `x.0.1`/`x.1` once the parent approves it. Updates still happen without touching the device, and `.0` never gets pushed. Real deferral (1–90 days) needs supervision.
- Some developers disable device-assigned licensing for their apps. Those apps fall back to asking for an Apple ID. The catalog should track whether each app supports device licensing.

## 3. The hurdles, and one that changes the plan

### 3a. Apple doesn't allow MDM for individuals or personal devices

To run your own MDM server (NanoMDM/MicroMDM), you need an APNs MDM push certificate signed by an MDM vendor certificate. Apple only issues vendor certificates to organizations. The usual workaround for open-source MDM, [mdmcert.download](https://mdmcert.download/about), now says:

> "Apple very explicitly forbids individual use and personal devices from obtaining and using MDM systems."

It blocks free email domains to enforce this.

**Consequence: self-hosted NanoMDM is not available to Apogee as a family project.** It needs a legal entity.

### 3b. App licenses need Apple Business Manager, and ABM needs a legal entity

ABM (now part of "Apple Business") requires a **legal entity (LLC, corporation, LP) with a D-U-N-S number**. Sole proprietorships, DBAs, and trade names are not accepted. A D-U-N-S number is free but can take up to 30 days. ([Apple: D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/), [Hexnode: Apple Business enrollment](https://www.hexnode.com/mobile-device-management/help/how-to-enroll-in-apple-dep/))

Without ABM there are no device-assigned licenses, and without those, MDM installs still go through Ask to Buy. That defeats the main pain point. **So requirement #1 depends on ABM.**

### 3c. Public hosting means authentication is mandatory

The iPads and Apple's push service have to reach the MDM server over public HTTPS. Apogee currently has no auth. Authentication has to ship before any device enrolls.

## 4. The licensing model is the real constraint

Commercial MDMs like Fleet don't hold licenses for their customers. **Each customer brings their own Apple accounts.** The vendor signs the push-certificate request ([Fleet docs](https://fleetdm.com/docs/using-fleet/MDM-setup)). The customer creates the push certificate with their own Apple account, buys app licenses in their own ABM, and manages devices they own. Fleet supports [multiple ABM/VPP tokens](https://fleetdm.com/guides/install-vpp-apps-on-macos-using-fleet) for service providers, but each token still belongs to a client organization.

That model doesn't carry over to families. Every household would need its own ABM, which means its own legal entity. Apple has no consumer version of ABM licensing. The consumer equivalent is Family Sharing plus Ask to Buy. Two things are **unverified**, and both are likely problems:
- Using one Apogee-owned push certificate to manage many families' personal iPads (mdmcert.download quotes Apple as "very explicitly" forbidding MDM on personal devices).
- Installing ABM licenses that Apogee bought onto other households' devices.

## 5. Decision (2026-10-06)

**The multi-family product is built on paths that need no organization:**

1. **App Store and Family Sharing.** Apogee curates the catalog, matches apps to each child, links to the App Store, and tracks state. Ask to Buy stays, but Apogee makes each approval quicker and better informed.
2. **The Screen Time API** (FamilyControls / ManagedSettings / DeviceActivity). This is Apple's framework for consumer parental controls: app blocking, downtime, app limits, and Homework/Educational modes. It can't install apps. Development builds run on your own registered devices without Apple's approval. TestFlight and App Store distribution need a Family Controls distribution request **for each bundle ID** (the main app and each extension). In 2026, developers on Apple's forums report long waits for approval ([example](https://developer.apple.com/forums/thread/818553)).

**MDM is deferred until Apple confirms it's allowed:**

4. **Ask Apple** (Developer Support or a partnership inquiry) whether a family or consumer MDM model is allowed: a shared push certificate, and licenses deployed to other households. Until then, MDM is an add-on, not a foundation.

**MDM for this household only** (optional, once an LLC exists): **NanoMDM**, with Apogee as the dashboard. This is the same model as Fleet's, with this household's LLC as the organization. NanoMDM was chosen over Fleet because:
- Fleet puts ABM licensing (VPP), the feature that removes Ask to Buy, in **Premium** ([Fleet](https://fleetdm.com/guides/install-app-store-apps)).
- Fleet recommends 2 vCPU / 4 GB RAM plus MySQL and Redis ([reference architectures](https://fleetdm.com/docs/deploy/reference-architectures)).
- Fleet's admin UI would duplicate Apogee's.
- NanoMDM leaves tenancy (families, devices) in Apogee's own database.

MicroMDM is end-of-life and not an option.

Rejected options: wrapping a commercial MDM API (the per-device cost and family-use terms are both unclear), and Apogee-owned or leased devices (a different hardware business; it could be revisited later).

## 6. Open questions
- What does Apple say about consumer or family MDM (path 4)?
- How should bundle IDs be named? This must be settled before any Family Controls distribution request, because each request is for a specific bundle ID.
- Timing of the LLC. It's only needed for this household's MDM and ABM, not for paths 1–2.

## 7. Next tasks (not yet approved)
1. **Screen Time app spike:** a minimal native iOS app using FamilyControls, built as a development build on one of this household's iPads. It proves out authorization, shielding one app, and a downtime schedule.
2. **Apogee ↔ Screen Time app link:** the native app reads the child's profile and catalog from the Apogee API. This needs authentication first.
3. **Smarter App Store flow (path 1):** an App Store ID per catalog app, deep links, and a "requested by kid" state.
4. **Authentication.** Required before anything leaves the local network.
