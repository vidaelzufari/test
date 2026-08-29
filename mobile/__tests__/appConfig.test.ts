import appConfigDefault from "../app.config";
import appConfigJson from "../src/config/app.json";

/**
 * app.config.ts hardcodes its identity literals instead of importing
 * src/config/app.json (see the comment there for why — Node's config-loading
 * step for app.config.ts has repeatedly failed to resolve a cross-file
 * import across different Expo CLI/Node/build-image combinations). This test
 * is what actually enforces "single source of truth": it fails CI if anyone
 * edits one without the other.
 */
describe("app.config.ts stays in sync with src/config/app.json", () => {
  // ConfigContext's `config` param is the static app.json config, unused here
  // since this project has no app.json (app.config.ts is the only config).
  const resolved = appConfigDefault({ config: {} } as never);

  it("matches the app name and slug", () => {
    expect(resolved.name).toBe(appConfigJson.APP_NAME);
    expect(resolved.slug).toBe(appConfigJson.APP_SLUG);
    expect(resolved.scheme).toBe(appConfigJson.APP_SCHEME);
  });

  it("matches the iOS bundle identifier", () => {
    expect(resolved.ios?.bundleIdentifier).toBe(appConfigJson.IOS_BUNDLE_ID);
  });

  it("matches the Android package", () => {
    expect(resolved.android?.package).toBe(appConfigJson.ANDROID_PACKAGE);
  });
});
