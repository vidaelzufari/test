import { addDays, addHours, addMonths } from "date-fns";
import { StashItem, StashStatus } from "@/db/types";
import { DEFAULT_STORAGE_RULES, StashExpiryInfo, StashForecast, StashStorageRules } from "./types";

const ACTIVE_STATUSES: StashStatus[] = ["available", "thawed"];

export function computeItemExpiry(
  item: StashItem,
  now: Date,
  rules: StashStorageRules = DEFAULT_STORAGE_RULES
): StashExpiryInfo {
  if (item.status === "thawed") {
    const thawedAt = item.thawedAt ? new Date(item.thawedAt) : new Date(item.pumpedAt);
    const deadline = addHours(thawedAt, rules.thawedHours);
    return {
      item,
      expiresAt: deadline,
      state: classifyByDeadline(now, thawedAt, deadline, rules.expiringSoonThreshold),
      reasonCode: "thawed_24_hours",
    };
  }

  const pumpedAt = new Date(item.pumpedAt);

  if (item.location === "counter") {
    const deadline = addHours(pumpedAt, rules.counterHours);
    return {
      item,
      expiresAt: deadline,
      state: classifyByDeadline(now, pumpedAt, deadline, rules.expiringSoonThreshold),
      reasonCode: "counter_4_hours",
    };
  }

  if (item.location === "fridge") {
    const deadline = addDays(pumpedAt, rules.fridgeDays);
    return {
      item,
      expiresAt: deadline,
      state: classifyByDeadline(now, pumpedAt, deadline, rules.expiringSoonThreshold),
      reasonCode: "fridge_4_days",
    };
  }

  // freezer: "best" quality deadline and outer "acceptable" deadline.
  const bestDeadline = addMonths(pumpedAt, rules.freezerBestMonths);
  const acceptableDeadline = addMonths(pumpedAt, rules.freezerAcceptableMonths);

  if (now.getTime() >= acceptableDeadline.getTime()) {
    return { item, expiresAt: acceptableDeadline, state: "expired", reasonCode: "freezer_12_months_acceptable" };
  }
  if (now.getTime() >= bestDeadline.getTime()) {
    return { item, expiresAt: bestDeadline, state: "expiring_soon", reasonCode: "freezer_6_months_best" };
  }
  return {
    item,
    expiresAt: bestDeadline,
    state: classifyByDeadline(now, pumpedAt, bestDeadline, rules.expiringSoonThreshold),
    reasonCode: "freezer_6_months_best",
  };
}

function classifyByDeadline(
  now: Date,
  madeAt: Date,
  deadline: Date,
  thresholdFraction: number
): StashExpiryInfo["state"] {
  const remainingMs = deadline.getTime() - now.getTime();
  if (remainingMs <= 0) return "expired";
  const totalSpanMs = deadline.getTime() - madeAt.getTime();
  if (totalSpanMs <= 0) return "expired";
  return remainingMs <= totalSpanMs * thresholdFraction ? "expiring_soon" : "fresh";
}

/**
 * Current stash total, coverage in days at the baby's actual average
 * intake, oldest-first "use this next" guidance, and expiry notices.
 * CDC-derived storage windows; a locale-specific footnote belongs in the
 * UI copy, not here.
 */
export function computeStashForecast(
  items: StashItem[],
  now: Date,
  averageDailyIntakeMl: number | null,
  rules: StashStorageRules = DEFAULT_STORAGE_RULES
): StashForecast {
  const active = items.filter((i) => ACTIVE_STATUSES.includes(i.status));
  const totalMl = active.reduce((sum, i) => sum + i.ml, 0);

  const oldestFirst = [...active].sort(
    (a, b) => new Date(a.pumpedAt).getTime() - new Date(b.pumpedAt).getTime()
  );
  const useNextItemId = oldestFirst[0]?.id ?? null;

  const expiryInfos = active.map((item) => computeItemExpiry(item, now, rules));

  return {
    totalMl,
    daysOfCoverage:
      averageDailyIntakeMl && averageDailyIntakeMl > 0 ? totalMl / averageDailyIntakeMl : null,
    averageDailyIntakeMl,
    useNextItemId,
    expiring: expiryInfos.filter((e) => e.state === "expiring_soon"),
    expired: expiryInfos.filter((e) => e.state === "expired"),
  };
}

/**
 * Encodes "never refreeze": once an item has been thawed it can only move
 * to used/discarded, never back to available/fridge/freezer storage.
 */
export function canTransitionStashStatus(from: StashStatus, to: StashStatus): boolean {
  if (from === to) return true;
  if (from === "used" || from === "discarded") return false; // terminal states
  if (from === "thawed") return to === "used" || to === "discarded";
  if (from === "available") return to === "thawed" || to === "used" || to === "discarded";
  return false;
}
