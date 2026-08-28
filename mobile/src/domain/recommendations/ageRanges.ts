import { AgeTypicalFeedRange } from "./types";

/**
 * Age-typical feeds-per-24h, tightening as the baby grows. General pediatric
 * guidance ranges, not medical advice — always surfaced with a disclaimer.
 * Breakpoints are in whole weeks of age, ordered ascending; the last entry
 * applies to every age at or beyond its `uptoWeeks`.
 */
interface Breakpoint extends AgeTypicalFeedRange {
  uptoWeeks: number;
}

const BREAKPOINTS: Breakpoint[] = [
  { uptoWeeks: 4, minPerDay: 8, maxPerDay: 12 }, // newborn
  { uptoWeeks: 8, minPerDay: 7, maxPerDay: 10 },
  { uptoWeeks: 17, minPerDay: 6, maxPerDay: 8 }, // ~4 months
  { uptoWeeks: 26, minPerDay: 5, maxPerDay: 7 }, // ~6 months
  { uptoWeeks: Infinity, minPerDay: 4, maxPerDay: 6 }, // 6mo+, solids typically introduced
];

export function ageTypicalFeedRange(ageWeeks: number): AgeTypicalFeedRange {
  const clamped = Math.max(0, ageWeeks);
  const match = BREAKPOINTS.find((bp) => clamped < bp.uptoWeeks) ?? BREAKPOINTS[BREAKPOINTS.length - 1]!;
  return { minPerDay: match.minPerDay, maxPerDay: match.maxPerDay };
}

/** Converts a feeds-per-day range into a typical interval-between-feeds range, in minutes. */
export function ageTypicalIntervalMinutes(ageWeeks: number): { minMinutes: number; maxMinutes: number } {
  const { minPerDay, maxPerDay } = ageTypicalFeedRange(ageWeeks);
  const MINUTES_PER_DAY = 24 * 60;
  // More feeds/day => shorter interval, so max feeds maps to min interval.
  return {
    minMinutes: Math.round(MINUTES_PER_DAY / maxPerDay),
    maxMinutes: Math.round(MINUTES_PER_DAY / minPerDay),
  };
}
