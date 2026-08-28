/**
 * Single source of truth for the product's name and identity.
 * Every screen, store listing draft, and native config reads from here —
 * never hardcode the app name elsewhere.
 */
export const APP_NAME = "The Nursing Queen";
export const APP_SHORT_NAME = "Nursing Queen";
export const APP_SLUG = "the-nursing-queen";
export const APP_SCHEME = "nursingqueen";
export const IOS_BUNDLE_ID = "com.nursingqueen.app";
export const ANDROID_PACKAGE = "com.nursingqueen.app";

/** Non-consumable IAP identifier gating recommendations + stash forecasting. */
export const QUEEN_UNLOCK_ENTITLEMENT_ID = "queen_unlock";
export const QUEEN_UNLOCK_PRODUCT_ID = "queen_unlock_lifetime";
