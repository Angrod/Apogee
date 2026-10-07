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

## 4. Engine options

| | NanoMDM (self-hosted) | Wrap a commercial MDM (e.g. SimpleMDM) |
|---|---|---|
| Push cert | Needs vendor signing, organizations only (3a) | Vendor handles signing; you upload a cert you create at Apple's Push Certificates Portal |
| Cost | Hosting only | ~$2.50/device/month, about $7.50/month for 3 iPads, REST API included ([GetApp](https://www.getapp.com/all-software/a/simplemdm/)) |
| Setup effort | High: server, TLS, SCEP, APNs, DDM, ABM token sync | Low: enroll the devices, call the API |
| Control | Full protocol access | Whatever the vendor API exposes (apps, profiles, inventory, and OS updates are standard) |
| Fit for a commercial product | Best long-term; this is what an "Apogee MDM" product would run on | Fine for MVP; per-device cost and vendor lock-in at scale |
| ABM still needed for no-Ask-to-Buy installs? | Yes | Yes |

**Unverified:** whether commercial MDM vendors' terms allow purely personal or family use. Check this before signing up.

## 5. Recommendation

The real blocker isn't which MDM engine to use. **It's not having a legal entity.** Both the NanoMDM path and the "no Ask to Buy" path need one. The user already sees Apogee as the seed of a commercial product, so:

1. **Form an LLC** (it serves the future business too) and request a free D-U-N-S number. This takes a few weeks and is outside the code.
2. **Enroll in Apple Business (ABM)** using the LLC. The free apps in the catalog can be "purchased" there at $0 and assigned as device licenses.
3. **Engine: start with a commercial MDM API, behind an Apogee provider interface.** It's the quickest way to get real installs, and it lets us test the product (self-service catalog, update policy) on three iPads for a few dollars a month. Once the LLC exists, NanoMDM becomes possible, and switching to it means writing one new provider rather than rebuilding.
   - If the user would rather build on NanoMDM from day one (more ownership and learning, slower), that's reasonable once the LLC and push cert are in place. The provider interface is the same either way.
4. **Ship auth before enrolling any device.**
5. **Supervision is the next step after that.** Wipe and supervise through Apple Configurator, then add the device to ABM. That unlocks real `.0` deferral, App Store lockdown, and silent installs.

### What happens with no LLC
Apogee can still enroll the iPads through a commercial MDM (if its terms allow personal use) and get inventory, real installed-state, and update *enforcement*. But app installs will still trigger Ask to Buy, so the main pain point isn't solved.

## 6. Open questions for the user
- Is forming an LLC acceptable? (Recommended: it unblocks ABM and NanoMDM, and supports the commercial plan.)
- Start on a commercial MDM API, or wait for the LLC and go straight to NanoMDM?
- Are any catalog apps paid? ABM licenses for paid apps cost money per device.

## 7. Next tasks (pending decisions)
1. Authentication (required before enrollment).
2. Device-control layer: a `devices` table, an `mdm_commands` log, `apps.adam_id`, and a provider interface in `artifacts/api-server/src/lib/device-control/`. Add `Requested`/`Installing`/`Failed` states; `Installed` comes from device inventory.
3. Kid self-service view: a home-screen web clip showing only that child's matched catalog apps, built with big icons and little text for ages 3–7.
4. OS update policy: an approved-version list per device, pushed as enforcement declarations.
