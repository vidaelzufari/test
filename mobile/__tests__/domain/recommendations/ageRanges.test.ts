import { ageTypicalFeedRange, ageTypicalIntervalMinutes } from "@/domain/recommendations/ageRanges";

describe("ageTypicalFeedRange", () => {
  it("returns newborn range for weeks 0-3", () => {
    expect(ageTypicalFeedRange(0)).toEqual({ minPerDay: 8, maxPerDay: 12 });
    expect(ageTypicalFeedRange(3)).toEqual({ minPerDay: 8, maxPerDay: 12 });
  });

  it("tightens at the 4-week boundary", () => {
    expect(ageTypicalFeedRange(4)).toEqual({ minPerDay: 7, maxPerDay: 10 });
    expect(ageTypicalFeedRange(7)).toEqual({ minPerDay: 7, maxPerDay: 10 });
  });

  it("tightens further at 8 weeks (~2 months)", () => {
    expect(ageTypicalFeedRange(8)).toEqual({ minPerDay: 6, maxPerDay: 8 });
    expect(ageTypicalFeedRange(16)).toEqual({ minPerDay: 6, maxPerDay: 8 });
  });

  it("tightens at 17 weeks (~4 months)", () => {
    expect(ageTypicalFeedRange(17)).toEqual({ minPerDay: 5, maxPerDay: 7 });
    expect(ageTypicalFeedRange(25)).toEqual({ minPerDay: 5, maxPerDay: 7 });
  });

  it("settles into the 6-months-plus range and stays there", () => {
    expect(ageTypicalFeedRange(26)).toEqual({ minPerDay: 4, maxPerDay: 6 });
    expect(ageTypicalFeedRange(52)).toEqual({ minPerDay: 4, maxPerDay: 6 });
    expect(ageTypicalFeedRange(520)).toEqual({ minPerDay: 4, maxPerDay: 6 });
  });

  it("clamps negative ages to the newborn range", () => {
    expect(ageTypicalFeedRange(-5)).toEqual({ minPerDay: 8, maxPerDay: 12 });
  });
});

describe("ageTypicalIntervalMinutes", () => {
  it("derives interval bounds by inverting feeds-per-day (more feeds = shorter interval)", () => {
    // newborn: 8-12 feeds/day -> 120-180 minute interval
    expect(ageTypicalIntervalMinutes(0)).toEqual({ minMinutes: 120, maxMinutes: 180 });
  });

  it("widens the interval as feed frequency drops with age", () => {
    // 6mo+: 4-6 feeds/day -> 240-360 minute interval
    expect(ageTypicalIntervalMinutes(30)).toEqual({ minMinutes: 240, maxMinutes: 360 });
  });

  it("min interval is always <= max interval across the full age curve", () => {
    for (let weeks = 0; weeks <= 60; weeks += 1) {
      const { minMinutes, maxMinutes } = ageTypicalIntervalMinutes(weeks);
      expect(minMinutes).toBeLessThanOrEqual(maxMinutes);
    }
  });
});
