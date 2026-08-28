import { MilkType, StashItem, StashLocation } from "@/db/types";

export interface FeedSample {
  /** Nursing session start, or bottle/pump occurrence — any "feed" moment. */
  at: Date;
}

export interface AgeTypicalFeedRange {
  minPerDay: number;
  maxPerDay: number;
}

export interface NextFeedWindow {
  /** True once enough of the mother's own data exists to lean on it. */
  hasOwnData: boolean;
  expectedAt: Date;
  earliestAt: Date;
  latestAt: Date;
  /** Minutes, for display/testing convenience. */
  intervalMinutes: number;
}

export interface PumpSlotSuggestion {
  label: "morning" | "midday" | "afternoon" | "evening" | "night";
  suggestedAt: Date;
  reason: "gap-between-feeds" | "morning-surplus" | "stash-goal";
}

export interface PumpSuggestionResult {
  slots: PumpSlotSuggestion[];
  mlStillNeededForGoal: number | null;
  daysUntilReturnToWork: number | null;
}

export type ExpiryState = "fresh" | "expiring_soon" | "expired";

export interface StashExpiryInfo {
  item: StashItem;
  state: ExpiryState;
  expiresAt: Date;
  /** Machine-readable reason code; screens map this to localized copy. */
  reasonCode:
    | "fridge_4_days"
    | "freezer_6_months_best"
    | "freezer_12_months_acceptable"
    | "thawed_24_hours"
    | "counter_4_hours";
}

export interface StashForecast {
  totalMl: number;
  daysOfCoverage: number | null;
  averageDailyIntakeMl: number | null;
  useNextItemId: string | null;
  expiring: StashExpiryInfo[];
  expired: StashExpiryInfo[];
}

export interface StashStorageRules {
  counterHours: number;
  fridgeDays: number;
  freezerBestMonths: number;
  freezerAcceptableMonths: number;
  thawedHours: number;
  /** Fraction of remaining shelf-life under which an item counts as "expiring soon". */
  expiringSoonThreshold: number;
}

export const DEFAULT_STORAGE_RULES: StashStorageRules = {
  counterHours: 4,
  fridgeDays: 4,
  freezerBestMonths: 6,
  freezerAcceptableMonths: 12,
  thawedHours: 24,
  expiringSoonThreshold: 0.2,
};

export const MEDICAL_DISCLAIMER_KEY = "recommendations.disclaimer";

export type { MilkType, StashLocation };
