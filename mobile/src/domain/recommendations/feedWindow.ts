import { addMinutes, differenceInMinutes } from "date-fns";
import { ageTypicalIntervalMinutes } from "./ageRanges";
import { NextFeedWindow } from "./types";

const MAX_INTERVALS_CONSIDERED = 6;

/**
 * Expected next-feed window: the baby's own recent intervals, guard-railed
 * against age-typical ranges so a single outlier gap (a long night stretch,
 * a missed log) can't skew the suggestion. Falls back to the pure
 * age-typical range when there isn't enough of her own data yet.
 */
export function computeNextFeedWindow(
  recentFeedTimes: Date[],
  ageWeeks: number,
  now: Date
): NextFeedWindow {
  const sorted = [...recentFeedTimes].sort((a, b) => a.getTime() - b.getTime());
  const ageTypical = ageTypicalIntervalMinutes(ageWeeks);
  const typicalMid = Math.round((ageTypical.minMinutes + ageTypical.maxMinutes) / 2);

  if (sorted.length < 2) {
    const anchor = sorted[sorted.length - 1] ?? now;
    return {
      hasOwnData: false,
      expectedAt: addMinutes(anchor, typicalMid),
      earliestAt: addMinutes(anchor, ageTypical.minMinutes),
      latestAt: addMinutes(anchor, ageTypical.maxMinutes),
      intervalMinutes: typicalMid,
    };
  }

  const lastFeedAt = sorted[sorted.length - 1]!;
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(differenceInMinutes(sorted[i]!, sorted[i - 1]!));
  }
  const recentIntervals = intervals.slice(-MAX_INTERVALS_CONSIDERED);
  const avgInterval = recentIntervals.reduce((sum, v) => sum + v, 0) / recentIntervals.length;

  // Guard rails: keep the personalized estimate within a sane multiple of
  // the age-typical range so a single unusual gap doesn't dominate.
  const lowerBound = ageTypical.minMinutes * 0.6;
  const upperBound = ageTypical.maxMinutes * 1.6;
  const clampedInterval = Math.min(Math.max(avgInterval, lowerBound), upperBound);

  const variability = Math.max(clampedInterval * 0.2, 10);

  return {
    hasOwnData: true,
    expectedAt: addMinutes(lastFeedAt, clampedInterval),
    earliestAt: addMinutes(lastFeedAt, Math.max(clampedInterval - variability, 0)),
    latestAt: addMinutes(lastFeedAt, clampedInterval + variability),
    intervalMinutes: Math.round(clampedInterval),
  };
}
