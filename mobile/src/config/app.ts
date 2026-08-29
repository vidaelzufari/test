import appConfig from "./app.json";

/**
 * Single source of truth for the product's name and identity.
 * Every screen, store listing draft, and native config reads from here —
 * never hardcode the app name elsewhere.
 *
 * The actual values live in ./app.json, not here: app.config.ts also needs
 * these values, and Node's config-loading step for app.config.ts cannot
 * reliably resolve a nested `.ts` import (it works in some Expo CLI/Node
 * combinations and fails with "Cannot use import statement outside a
 * module" or "Cannot find module" in others). A plain JSON import has no
 * such ambiguity — both this file and app.config.ts import it directly.
 */
export const APP_NAME: string = appConfig.APP_NAME;
export const APP_SHORT_NAME: string = appConfig.APP_SHORT_NAME;
export const APP_SLUG: string = appConfig.APP_SLUG;
export const APP_SCHEME: string = appConfig.APP_SCHEME;
export const IOS_BUNDLE_ID: string = appConfig.IOS_BUNDLE_ID;
export const ANDROID_PACKAGE: string = appConfig.ANDROID_PACKAGE;

/** Non-consumable IAP identifier gating recommendations + stash forecasting. */
export const QUEEN_UNLOCK_ENTITLEMENT_ID: string = appConfig.QUEEN_UNLOCK_ENTITLEMENT_ID;
export const QUEEN_UNLOCK_PRODUCT_ID: string = appConfig.QUEEN_UNLOCK_PRODUCT_ID;
