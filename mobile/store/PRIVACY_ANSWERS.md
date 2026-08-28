# Privacy Questionnaire Answers — The Nursing Queen

Internal reference for filling out Apple's App Privacy ("nutrition label") questionnaire
and the Google Play Data Safety form. Precise, not marketing copy. Based strictly on the
current architecture (v1.0.0): no accounts, no login, no cloud backend of any kind.

Sources reviewed: `app.config.ts`, `src/db/client.ts` (+ `src/db/repositories/*.ts`),
`src/services/sentry.ts`, `src/services/revenuecat.ts`.

## Architecture summary

- **No user accounts, no login, no first-party server.** There is nothing for the
  developer to run a backend for — the app has no API client pointed at any
  developer-owned service.
- **All app data is local.** Feeding/pumping/bottle logs, baby profiles (name, date of
  birth, photo URI), and weight entries are stored only in a local SQLite database on
  the device (`expo-sqlite`, file `nursing_queen.db`), written to via
  `src/db/repositories/*.ts`. Nothing in that path makes a network call.
- **Baby photos** are picked via `expo-image-picker` and referenced by a local file URI
  only (`profile.photo` / `NSPhotoLibraryUsageDescription` /
  `NSCameraUsageDescription` in `app.config.ts`); the photo file itself is never
  uploaded or transmitted.
- **No analytics SDK** is present anywhere in the app.
- **Sentry** (`sentry-expo`, wired in `src/services/sentry.ts`) is used for crash/error
  reporting only (`tracesSampleRate: 0`, no session replay, no analytics). It actively
  scrubs PII before anything leaves the device: `beforeSend`/`beforeBreadcrumb` strip
  `name`, `note`/`notes`, `photoUri`, and `dateOfBirth` fields from event `extra` and
  `contexts`, and `event.user` is explicitly set to `undefined` on every event ("no
  accounts, never attach user identity"). Sentry is a no-op with no DSN configured.
- **RevenueCat** (`src/services/revenuecat.ts`, `react-native-purchases`) manages a
  single non-consumable in-app purchase, "Queen Unlock." It necessarily sees purchase/
  transaction data and assigns an anonymous RevenueCat app-user-id. That ID is not
  linked to any developer-side account, profile, or personal identity — there is no
  login system in the app for it to be linked to.

The four-button logger, History, and Profile screens never touch RevenueCat or Sentry
with feeding/profile data — only the paywall/recommendations code path talks to
RevenueCat, and only crash/error metadata (scrubbed) goes to Sentry.

## Apple App Privacy ("nutrition label")

Answer per category, as the app would be configured in App Store Connect:

| Category | Collected? | Notes |
|---|---|---|
| **Contact Info** (name, email, phone, physical address, other contact info) | Not Collected | No account, no forms collecting contact info. Baby's name is a profile field but never leaves the device — see "Health & Fitness" below and the local-only note. |
| **Health & Fitness** (health, fitness) | Not Collected (by developer) | Feeding/pumping/bottle logs, weight entries, and date of birth are health-adjacent data, but they are stored **only** in the on-device SQLite database and are never transmitted to the developer or any third party. Apple's label describes data the developer *collects*; since this data never leaves the device, "Not Collected" is the accurate declaration. (See "device-local" note below if Apple's form separates "processed on-device" from "collected.") |
| **Financial Info** (payment info, credit info, other financial info) | Not Collected | Purchases are handled by Apple's StoreKit / RevenueCat; the developer never sees or stores card data. |
| **Purchases** (purchase history) | Collected — Linked to a RevenueCat pseudonymous ID, Not Linked to the user's identity | RevenueCat records that the anonymous app-user-id purchased the "Queen Unlock" non-consumable, for entitlement/restore purposes. See Open Questions below on the linked/not-linked call. Not used for tracking. |
| **Location** (precise, coarse) | Not Collected | App requests no location permission and has no location code path. |
| **Sensitive Info** | Not Collected | No race, sexual orientation, religion, etc. fields exist. |
| **Contacts** | Not Collected | No contacts access. |
| **User Content** (photos/videos, audio, gameplay content, customer support, other user content) | Not Collected | Baby profile photo is picked via `expo-image-picker` and kept as a local file URI on-device only; never uploaded. |
| **Browsing History** | Not Collected | N/A — no in-app browser or web tracking. |
| **Search History** | Not Collected | N/A |
| **Identifiers** (user ID, device ID) | Collected — RevenueCat app-user-id only | RevenueCat generates a pseudonymous app-user-id (not tied to an Apple ID, email, or any developer account) solely to track entitlement to the one IAP. Not used for tracking (no cross-app/cross-site ad tracking; ATT is not invoked). |
| **Usage Data** (product interaction, advertising data, other usage data) | Not Collected | No analytics SDK anywhere in the app. |
| **Diagnostics** (crash data, performance data, other diagnostic data) | Collected — Not Linked to the user's identity | Sentry crash/error reports only. `event.user` is explicitly cleared and known PII fields (name, note, photoUri, dateOfBirth) are scrubbed before the event is sent. No tracesSampleRate (performance tracing disabled). |
| **Other Data** | Not Collected | — |

**Data Used to Track You:** None. The app performs no cross-app/cross-website tracking,
uses no advertising SDK or ad identifiers, and does not use RevenueCat's or Sentry's
identifiers for tracking purposes — only for purchase-entitlement lookup and crash
triage respectively. App Tracking Transparency prompt is not needed and not shown.

## Google Play Data Safety form

Parallel declarations for the same architecture:

- **Does your app collect or share any of the required user data types?** Yes, limited:
  Purchase history (via RevenueCat, for entitlement) and Crash/Diagnostics data (via
  Sentry). Everything else: No.
- **Data types collected:**
  - *Financial info → Purchase history*: Collected. Not shared with third parties beyond
    RevenueCat as the payment/entitlement processor. Purpose: App functionality (unlock
    entitlement, restore purchases). Encrypted in transit. User cannot request deletion
    of Play/App Store purchase records (governed by the platform), but no
    developer-side record beyond RevenueCat's exists.
  - *App activity / Crash logs → Diagnostics*: Collected via Sentry. Purpose: App
    functionality / analytics (crash fixing only — no behavioral analytics). Encrypted
    in transit. PII scrubbed before send (see architecture summary).
  - *Personal info (name, health info, photos)*: **Not collected** by the developer.
    Declared as on-device only / not transmitted. Google Play's Data Safety form asks
    about data *collected or shared off-device*; since baby names, DOB, weights, feeding
    logs, and photos never leave the device, they should be declared as not collected,
    with an accurate description that they are stored locally.
- **Is all user data encrypted in transit?** Yes for the two flows that do transmit
  data (RevenueCat purchase sync, Sentry crash reports) — both are HTTPS. There's no
  encryption question for on-device SQLite data.
- **Do you provide a way for users to request data deletion?** Uninstalling the app
  deletes the local SQLite database and all local profile/photo data. There is no
  developer-side data store to issue a separate deletion request against, since no
  personal/health data is collected off-device. Purchase and crash records held by
  RevenueCat/Sentry would need those vendors' own deletion mechanisms if ever required.
- **Data Safety section — "Data is encrypted in transit" / "Users can request data
  deletion"**: both can be answered Yes on the narrow basis above; flag the nuance to
  legal/App reviewer so the listing language doesn't overclaim a deletion flow that
  doesn't exist for local-only data (there's nothing server-side to delete).

## Open questions for legal review

1. **RevenueCat purchase data — "Linked to you" vs. "Not Linked to you" (Apple).**
   Apple's guidance treats data as "linked" if it can be connected to identity via the
   app's own systems (even a pseudonymous ID it controls) combined with other data it
   holds. This app has no login, no email, no name tied to the purchase — the
   RevenueCat app-user-id is generated locally and never combined with the baby profile
   data (which never leaves the device). Our conclusion above is **treat as "Linked to
   a pseudonymous identifier, not the user's real-world identity"** for the Purchases
   row — practically meaning "collected, minimally linked, not used for tracking."
   Flagging because Apple's binary linked/not-linked toggle doesn't have a clean
   "pseudonymous-only" option; picking "Linked to you" is the more conservative choice
   if reviewers want to avoid any ambiguity, at the cost of a slightly scarier label
   for what is in practice just IAP entitlement bookkeeping.
2. **Sentry diagnostics — "Linked to you" vs. "Not Linked to you" (Apple).** Sentry
   events do carry an install-scoped device/session identifier (from the Sentry SDK
   itself) even though `event.user` is cleared and PII keys are scrubbed. We concluded
   "Not Linked" is defensible since no name/contact/account identity is attached, but
   Sentry's default device context (OS version, device model, IP address at ingestion)
   could arguably count as a device identifier under Apple's stricter reading. Worth
   confirming whether Sentry's IP-based geolocation/enrichment (if enabled on the
   Sentry project side, outside this repo) should be disclosed separately.
3. **Health & Fitness category framing.** Feeding/pumping logs and weight entries are
   arguably "Health & Fitness" data by Apple's category definitions, but Apple's
   nutrition label is about data the *developer* collects (i.e., receives), not data
   the app merely processes locally. We've declared "Not Collected" on that basis;
   legal should confirm this reading holds, especially if any future version adds
   iCloud backup of the SQLite file (which would move this from on-device-only to
   Apple-adjacent storage and change the answer).
4. **Google Play "Data collection" definition for on-device SQLite.** Same reasoning as
   #3 applies to Play's Data Safety form, which similarly scopes "collection" to data
   transmitted off the device. Confirm this matches Google's current policy language
   before submission, since Play's definitions have shifted over past policy updates.
5. **Children's privacy program (Apple "Kids Category") / COPPA.** The app is used by
   parents to log data *about* a child, but the app's registered user is the parent —
   it is not marketed to or used directly by children, and collects no data from a
   child. Assumed out of scope for Apple's Kids Category and COPPA's "directed to
   children" rules, but flagging since the subject matter (infant feeding) is
   adjacent enough that legal should sign off explicitly.
6. **`ITSAppUsesNonExemptEncryption: false`** is already set in `app.config.ts`, so no
   export-compliance documentation is expected to be needed beyond that declaration —
   confirm this still holds if any future dependency adds custom encryption.
