# CI/CD — EAS Build, Submit & Workflows

This documents the full pipeline and the one-time manual setup a human with
Expo/Apple/Google account access needs to run once. None of these steps can
be done from inside this repo/session — they need real account credentials.

## Pieces

1. **GitHub Actions** (`.github/workflows/mobile-ci.yml`, repo root) — fast
   feedback on every push/PR touching `mobile/**`: typecheck, lint, unit
   tests with coverage. On `release/*` branches it also kicks off an EAS
   `preview` build for both platforms (`--no-wait`, fire-and-forget) so
   Android parity is checked continuously even though Android ships later.
2. **EAS Workflows** (`mobile/.eas/workflows/*.yml`) — the actual
   build → submit pipeline, run by EAS's own infrastructure:
   - `release-internal.yml` — auto-triggered by pushing a tag matching
     `v*` (e.g. `v1.2.0`). Runs tests, builds iOS + Android from the
     `production` build profile, then submits those exact builds to
     **TestFlight** and the **Play internal testing track** only.
   - `release-production.yml` — has no automatic trigger at all. It only
     runs when a human explicitly invokes it (`eas workflow:run ... --input
     build_id_ios=... --input build_id_android=...`), naming the exact
     build IDs that already passed internal testing. It **promotes**
     that already-tested build rather than rebuilding from source, so what
     testers verified is byte-for-byte what goes public. The Android
     submit profile it uses (`eas.json` → `submit.production`) additionally
     sets `releaseStatus: "draft"`, so even this step lands as a draft in
     Play Console — a second human click ("Publish") is still required
     there. On iOS, `eas submit` only uploads to App Store Connect; Apple
     itself requires a separate manual "submit for review" / release step
     in App Store Connect before a build goes public. **There is no path
     in this repo that can publish to a public store track without at
     least two independent human actions.**
3. **eas.json** build profiles: `development` (dev client, internal
   distribution), `preview` (internal distribution, ad-hoc testers),
   `production` (store-distribution binary, auto-incrementing build
   number via `appVersionSource: "remote"` + `autoIncrement: true`).
4. **eas.json** submit profiles: `internal` (TestFlight + Play internal
   track, immediate rollout) and `production` (App Store Connect + Play
   production track, draft rollout on Android).

## One-time manual setup (requires your own Expo/Apple/Google accounts)

Run these from `mobile/`:

```bash
# 1. Log in and create the real EAS project (replaces the placeholder
#    projectId in app.config.ts's extra.eas.projectId).
eas login
eas init

# 2. Connect this GitHub repo to the EAS project so EAS Workflows can be
#    triggered natively (Expo dashboard → your project → GitHub tab, or):
eas project:info   # confirms the project, then link via the dashboard

# 3. Create an EAS robot access token for the GitHub Actions preview-build
#    job, and add it as a GitHub Actions secret named EXPO_TOKEN
#    (repo Settings → Secrets and variables → Actions):
eas robot:create --name "github-actions-mobile-ci"

# 4. Create environment variables per EAS environment (development/
#    preview/production), marking secrets as "sensitive" so they're
#    write-only and never appear in build logs:
eas env:create --environment development --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --visibility plaintext
eas env:create --environment preview     --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --visibility plaintext
eas env:create --environment production  --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --visibility plaintext

eas env:create --environment production  --name EXPO_PUBLIC_REVENUECAT_IOS_KEY     --value "<key>" --visibility sensitive
eas env:create --environment production  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "<key>" --visibility sensitive
# repeat for development/preview with their own RevenueCat sandbox keys

eas env:create --environment production  --name SENTRY_AUTH_TOKEN --value "<token>" --visibility secret
# SENTRY_AUTH_TOKEN is used at build time (sourcemap upload) only, never
# bundled into the app — "secret" visibility means it can't be read back
# at all after creation, only used by the build.

# 5. Apple + Google submit credentials — set once, used by both the
#    "internal" and "production" submit profiles:
eas env:create --environment production --name APPLE_ID_SET_IN_EAS_ENV --value "<apple id email>" --visibility sensitive
eas env:create --environment production --name ASC_APP_ID_SET_IN_EAS_ENV --value "<App Store Connect app id>" --visibility sensitive
eas env:create --environment production --name APPLE_TEAM_ID_SET_IN_EAS_ENV --value "<Apple Team ID>" --visibility sensitive
# Then replace the literal placeholder strings in eas.json's submit.internal
# / submit.production ios blocks with ${APPLE_ID_SET_IN_EAS_ENV} etc. once
# EAS env var substitution is confirmed working for your CLI version — see
# https://docs.expo.dev/eas/environment-variables/ (syntax has changed
# across EAS CLI versions; verify against the version you're pinned to).

# Google: store/google-service-account.json is a real secret file, never
# committed (already in .gitignore) — download it from Google Play Console
# → Setup → API access, and either eas secret:file upload it, or place it
# locally for local `eas submit` runs.
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY --type file --value ./store/google-service-account.json
```

## Cutting a release

```bash
# from a clean main/release branch, after CI is green:
npm version 1.2.0   # or manually bump app.config.ts's version
git tag v1.2.0
git push origin v1.2.0   # <-- triggers release-internal.yml automatically
```

Watch the EAS dashboard (or `eas build:list` / `eas submit:list`) for the
build + TestFlight/Play-internal submission to finish, test on real
devices, then when ready:

```bash
eas workflow:run .eas/workflows/release-production.yml \
  --input build_id_ios=<ios build id> \
  --input build_id_android=<android build id>
```

...then finish the release manually in App Store Connect and Play Console
as described above.
