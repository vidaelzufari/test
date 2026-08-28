import { addMinutes } from "date-fns";
import { computeNextFeedWindow } from "@/domain/recommendations/feedWindow";

describe("computeNextFeedWindow", () => {
  const now = new Date("2026-08-28T12:00:00Z");

  it("falls back to the pure age-typical range with no data at all", () => {
    const result = computeNextFeedWindow([], 0, now);
    expect(result.hasOwnData).toBe(false);
    expect(result.intervalMinutes).toBe(150); // (120+180)/2
    expect(result.expectedAt.getTime()).toBe(addMinutes(now, 150).getTime());
    expect(result.earliestAt.getTime()).toBe(addMinutes(now, 120).getTime());
    expect(result.latestAt.getTime()).toBe(addMinutes(now, 180).getTime());
  });

  it("anchors the age-typical range to the single known feed, not now", () => {
    const lastFeed = new Date("2026-08-28T10:00:00Z");
    const result = computeNextFeedWindow([lastFeed], 0, now);
    expect(result.hasOwnData).toBe(false);
    expect(result.expectedAt.getTime()).toBe(addMinutes(lastFeed, 150).getTime());
    expect(result.earliestAt.getTime()).toBe(addMinutes(lastFeed, 120).getTime());
    expect(result.latestAt.getTime()).toBe(addMinutes(lastFeed, 180).getTime());
  });

  it("uses the mother's own average interval once there are 2+ samples within bounds", () => {
    const sample1 = new Date("2026-08-28T07:00:00Z");
    const sample2 = new Date("2026-08-28T09:30:00Z"); // 150 min after sample1
    const result = computeNextFeedWindow([sample1, sample2], 0, now);
    expect(result.hasOwnData).toBe(true);
    expect(result.intervalMinutes).toBe(150);
    expect(result.expectedAt.getTime()).toBe(addMinutes(sample2, 150).getTime());
    expect(result.earliestAt.getTime()).toBe(addMinutes(sample2, 120).getTime());
    expect(result.latestAt.getTime()).toBe(addMinutes(sample2, 180).getTime());
  });

  it("clamps an unusually long gap to the upper guard rail instead of trusting it outright", () => {
    const sample1 = new Date("2026-08-28T00:00:00Z");
    const sample2 = new Date("2026-08-28T08:00:00Z"); // 480 min gap, newborn typical max is 180
    const result = computeNextFeedWindow([sample1, sample2], 0, now);
    // upperBound = 180 * 1.6 = 288
    expect(result.intervalMinutes).toBe(288);
    expect(result.expectedAt.getTime()).toBe(addMinutes(sample2, 288).getTime());
    const variability = 288 * 0.2;
    expect(result.earliestAt.getTime()).toBe(addMinutes(sample2, 288 - variability).getTime());
    expect(result.latestAt.getTime()).toBe(addMinutes(sample2, 288 + variability).getTime());
  });

  it("clamps an unusually short cluster-feeding gap to the lower guard rail", () => {
    const sample1 = new Date("2026-08-28T10:00:00Z");
    const sample2 = new Date("2026-08-28T10:30:00Z"); // 30 min gap
    const result = computeNextFeedWindow([sample1, sample2], 0, now);
    // lowerBound = 120 * 0.6 = 72
    expect(result.intervalMinutes).toBe(72);
    expect(result.expectedAt.getTime()).toBe(addMinutes(sample2, 72).getTime());
  });

  it("only considers the most recent 6 intervals, ignoring an old outlier", () => {
    const base = new Date("2026-08-01T00:00:00Z");
    const times = [base];
    times.push(addMinutes(base, 1000)); // 1 huge outlier interval, should be dropped
    for (let i = 0; i < 6; i++) {
      times.push(addMinutes(times[times.length - 1]!, 150));
    }
    // 8 samples -> 7 intervals -> only last 6 (all 150s) are averaged
    const result = computeNextFeedWindow(times, 0, now);
    expect(result.intervalMinutes).toBe(150);
    const lastFeed = times[times.length - 1]!;
    expect(result.expectedAt.getTime()).toBe(addMinutes(lastFeed, 150).getTime());
  });

  it("never returns an earliestAt before zero minutes out", () => {
    const sample1 = new Date("2026-08-28T09:59:00Z");
    const sample2 = new Date("2026-08-28T10:00:00Z"); // 1 min gap, extreme cluster feed
    const result = computeNextFeedWindow([sample1, sample2], 0, now);
    expect(result.earliestAt.getTime()).toBeGreaterThanOrEqual(sample2.getTime());
  });

  it("sorts out-of-order input before computing intervals", () => {
    const early = new Date("2026-08-28T07:00:00Z");
    const late = new Date("2026-08-28T09:30:00Z");
    const forward = computeNextFeedWindow([early, late], 0, now);
    const reversed = computeNextFeedWindow([late, early], 0, now);
    expect(reversed.expectedAt.getTime()).toBe(forward.expectedAt.getTime());
  });
});
