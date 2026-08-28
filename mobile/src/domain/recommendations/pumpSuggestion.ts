import { differenceInCalendarDays, differenceInMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { PumpSlotSuggestion, PumpSuggestionResult } from "./types";

const MIN_GAP_MINUTES_FOR_PUMP = 240; // 4h daytime stretch worth pumping in
const LOOKBACK_HOURS_FOR_GAPS = 72;
const MORNING_HOURS = [5, 6, 7, 8, 9, 10, 11];
const MORNING_SURPLUS_MULTIPLIER = 1.15;

export interface PumpSuggestionInput {
  /** Nursing session start times, most useful when limited to the last few days. */
  nursingStartTimes: Date[];
  /** Completed pump events with a known total, for the morning-surplus pattern. */
  pumpHistory: { at: Date; totalMl: number }[];
  now: Date;
  returnToWorkDate?: Date | null;
  targetStashMl?: number | null;
  currentStashMl?: number;
}

export function suggestPumpSlots(input: PumpSuggestionInput): PumpSuggestionResult {
  const slots: PumpSlotSuggestion[] = [];

  const gapSlot = findLongestGapSlot(input.nursingStartTimes, input.now);
  if (gapSlot) slots.push(gapSlot);

  const morningSlot = findMorningSurplusSlot(input.pumpHistory, input.now);
  if (morningSlot) slots.push(morningSlot);

  let mlStillNeededForGoal: number | null = null;
  let daysUntilReturnToWork: number | null = null;

  if (input.returnToWorkDate) {
    daysUntilReturnToWork = differenceInCalendarDays(input.returnToWorkDate, input.now);
    if (input.targetStashMl != null) {
      mlStillNeededForGoal = Math.max(0, input.targetStashMl - (input.currentStashMl ?? 0));
      if (daysUntilReturnToWork > 0 && mlStillNeededForGoal > 0) {
        slots.push({
          label: labelForHour(19),
          suggestedAt: nextOccurrenceOfHour(input.now, 19),
          reason: "stash-goal",
        });
      }
    }
  }

  return { slots, mlStillNeededForGoal, daysUntilReturnToWork };
}

function findLongestGapSlot(nursingStartTimes: Date[], now: Date): PumpSlotSuggestion | null {
  if (nursingStartTimes.length < 2) return null;
  const cutoff = new Date(now.getTime() - LOOKBACK_HOURS_FOR_GAPS * 60 * 60 * 1000);
  const sorted = [...nursingStartTimes]
    .filter((t) => t >= cutoff)
    .sort((a, b) => a.getTime() - b.getTime());
  if (sorted.length < 2) return null;

  let longestGapMinutes = 0;
  let longestGapMidpoint: Date | null = null;
  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i - 1]!;
    const end = sorted[i]!;
    const gapMinutes = differenceInMinutes(end, start);
    if (gapMinutes > longestGapMinutes) {
      longestGapMinutes = gapMinutes;
      longestGapMidpoint = new Date(start.getTime() + gapMinutes * 60 * 1000 * 0.5);
    }
  }

  if (!longestGapMidpoint || longestGapMinutes < MIN_GAP_MINUTES_FOR_PUMP) return null;

  const hour = longestGapMidpoint.getHours();
  return {
    label: labelForHour(hour),
    suggestedAt: nextOccurrenceOfHour(now, hour),
    reason: "gap-between-feeds",
  };
}

function findMorningSurplusSlot(
  pumpHistory: { at: Date; totalMl: number }[],
  now: Date
): PumpSlotSuggestion | null {
  if (pumpHistory.length < 3) return null;

  const byHour = new Map<number, number[]>();
  for (const entry of pumpHistory) {
    const hour = entry.at.getHours();
    const list = byHour.get(hour) ?? [];
    list.push(entry.totalMl);
    byHour.set(hour, list);
  }

  const overallAvg = pumpHistory.reduce((sum, e) => sum + e.totalMl, 0) / pumpHistory.length;
  if (overallAvg <= 0) return null;

  let bestHour: number | null = null;
  let bestAvg = 0;
  for (const hour of MORNING_HOURS) {
    const samples = byHour.get(hour);
    if (!samples || samples.length < 2) continue;
    const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestHour = hour;
    }
  }

  if (bestHour === null || bestAvg < overallAvg * MORNING_SURPLUS_MULTIPLIER) return null;

  return {
    label: labelForHour(bestHour),
    suggestedAt: nextOccurrenceOfHour(now, bestHour),
    reason: "morning-surplus",
  };
}

export function labelForHour(hour: number): PumpSlotSuggestion["label"] {
  if (hour >= 5 && hour <= 10) return "morning";
  if (hour >= 11 && hour <= 13) return "midday";
  if (hour >= 14 && hour <= 17) return "afternoon";
  if (hour >= 18 && hour <= 21) return "evening";
  return "night";
}

export function nextOccurrenceOfHour(now: Date, hour: number): Date {
  const candidate = setMilliseconds(setSeconds(setMinutes(setHours(now, hour), 0), 0), 0);
  if (candidate.getTime() <= now.getTime()) {
    return new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
  }
  return candidate;
}
