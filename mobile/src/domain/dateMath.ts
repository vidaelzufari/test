import { differenceInCalendarDays, differenceInMinutes, differenceInMonths, differenceInWeeks } from "date-fns";

export interface AgeBreakdown {
  days: number;
  weeks: number;
  months: number;
  /** Whole-months-only once past ~8 weeks, otherwise weeks — matches how parents naturally describe age. */
  isMonthsPhase: boolean;
}

/**
 * Age is computed from date-of-birth, always relative to an explicit `now`
 * so it's deterministic in tests and doesn't silently drift on stale renders.
 */
export function computeAge(dateOfBirth: Date, now: Date): AgeBreakdown {
  const days = Math.max(0, differenceInCalendarDays(now, dateOfBirth));
  const weeks = Math.floor(days / 7);
  const months = Math.max(0, differenceInMonths(now, dateOfBirth));
  return { days, weeks, months, isMonthsPhase: weeks >= 8 };
}

export function minutesSince(from: Date, now: Date): number {
  return Math.max(0, differenceInMinutes(now, from));
}

export function weeksSinceBirth(dateOfBirth: Date, now: Date): number {
  return Math.max(0, differenceInWeeks(now, dateOfBirth));
}

/** Formats a minute count as "Nh Mm" / "Nm" for the status strip. */
export function formatDurationShort(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
