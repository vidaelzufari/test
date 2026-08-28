# The Nursing Queen

A local-first feeding companion for breastfeeding mothers — nursing,
pumping, and bottles in one place, with gentle, personalized guidance.
Built with Expo (React Native) + TypeScript, targeting iOS App Store
submission first with full Android compatibility from day one.

## Product philosophy

The user is a sleep-deprived mother holding a baby. Every one of the four
home-screen buttons saves instantly with sensible defaults — ml, side, and
notes can always be filled in later from History. No save is ever blocked
behind a form.

## Stack

- Expo + React Native + TypeScript (strict), Expo Router
- Local-first: `expo-sqlite` behind a repository layer (`src/db/`) — the
  app works fully offline, no account, data survives app kill mid-session
- State: Zustand (`src/store/`)
- i18n: i18next + expo-localization — English, French, Arabic (full RTL)
- Design tokens + component library in `src/theme/` and `src/components/`
  before any screen was written
- Recommendations engine: pure, fully unit-tested functions in
  `src/domain/recommendations/` — no LLM in this build, structured so an
  AI layer can be added later without touching the rules engine's callers
- RevenueCat: one-time "Queen Unlock" non-consumable gating recommendations
  + stash forecasting; the four-button logger, history, and profile are
  free forever
- Sentry: crash reporting only, PII-scrubbed, no accounts/analytics SDKs

## Getting started

```bash
npm install
npm run generate:icons   # rasterizes assets/brand/icon-source.svg (first run only)
npm start
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest — domain/recommendations/date-math/units unit tests |
| `npm run test:coverage` | Same, with coverage (`src/domain/**` is gated at 90%/85%) |
| `npm run generate:icons` | Rebuilds all PNG assets from `assets/brand/icon-source.svg` |
| `npm run build:preview` / `build:production` | EAS builds (see below) |

## Architecture at a glance

```
src/
  config/app.ts        # single source of truth for the app name + IDs
  theme/                # design tokens + ThemeProvider (light/dark/night)
  components/           # Button, Card, StatChip, EntryRow, SuggestionCard, CrownMark
  db/                   # expo-sqlite client, versioned migrations, repositories
  store/                # Zustand stores wrapping the repositories
  domain/
    recommendations/    # pure, unit-tested rules engine (feed window, pump
                         # slots, stash forecast + CDC-based expiry rules)
    units.ts, dateMath.ts
  i18n/                 # i18next setup + en/fr/ar resource bundles
  services/             # revenuecat.ts, sentry.ts
app/                    # Expo Router screens
maestro/                # E2E flow specs (log nursing, log pump + add ml
                         # later, add bottle, edit history, switch to Arabic)
store/                  # App Store / Play Store readiness: metadata drafts,
                         # PRIVACY_ANSWERS.md, CI_CD.md, permission strings
```

## CI/CD

See [`store/CI_CD.md`](./store/CI_CD.md) for the full EAS Workflows +
GitHub Actions pipeline, the one-time manual setup (`eas init`, environment
variables, GitHub connection), and how a release is cut and promoted.
Short version: pushing a `v*` tag builds both platforms and ships them to
TestFlight + the Play internal testing track automatically; promoting to
the public App Store / Play production track always requires an explicit,
separate manual step.

## App Store readiness

- `store/PRIVACY_ANSWERS.md` — Apple App Privacy + Google Play Data Safety
  answers, grounded in the actual architecture (nothing leaves the device
  except crash reports and purchase receipts)
- `store/metadata/{en,fr,ar}.md` — store listing drafts
- `store/permissions-l10n.json` + `plugins/withLocalizedPermissions.js` —
  localized iOS photo/camera permission strings, injected at `expo
  prebuild` time
- `app.config.ts` — iOS privacy manifest (`NSPrivacyAccessedAPITypes`,
  `NSPrivacyTracking: false`) declared declaratively; Expo generates
  `PrivacyInfo.xcprivacy` from it during prebuild
- `eas.json` — `development` / `preview` / `production` build profiles;
  `internal` / `production` submit profiles

## Known follow-ups

- `extra.eas.projectId` in `app.config.ts` is a placeholder until `eas
  init` is run against a real Expo account (see `store/CI_CD.md`)
- RevenueCat product/offering must be created in the RevenueCat dashboard
  matching `QUEEN_UNLOCK_PRODUCT_ID` in `src/config/app.ts`
- Maestro flows in `maestro/` assume the testIDs already wired into the
  screens (see each flow's header comment) — run them against a real
  simulator/device build once EAS builds are flowing
