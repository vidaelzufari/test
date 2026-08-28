import * as Sentry from "sentry-expo";

/**
 * Crash reporting only — no analytics SDK, no accounts, no cloud sync in
 * this build. PII scrubbing is on: breadcrumbs and events are stripped of
 * anything that could carry the baby's name, photo URI, or free-text notes
 * before leaving the device.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return; // no-op in dev without a DSN configured

  Sentry.init({
    dsn,
    enableInExpoDevelopment: false,
    debug: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

const PII_KEYS = new Set(["name", "note", "notes", "photoUri", "photo_uri", "dateOfBirth", "date_of_birth"]);

function scrubEvent(event: Sentry.Native.Event): Sentry.Native.Event {
  if (event.extra) event.extra = scrubObject(event.extra);
  if (event.contexts) event.contexts = scrubObject(event.contexts) as typeof event.contexts;
  event.user = undefined; // no accounts, never attach user identity
  return event;
}

function scrubBreadcrumb(breadcrumb: Sentry.Native.Breadcrumb): Sentry.Native.Breadcrumb | null {
  if (breadcrumb.data) breadcrumb.data = scrubObject(breadcrumb.data);
  return breadcrumb;
}

export function scrubObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.has(key)) {
      result[key] = "[scrubbed]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
