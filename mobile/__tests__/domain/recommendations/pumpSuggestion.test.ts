import {
  labelForHour,
  nextOccurrenceOfHour,
  suggestPumpSlots,
} from "@/domain/recommendations/pumpSuggestion";

describe("labelForHour", () => {
  it.each([
    [4, "night"],
    [5, "morning"],
    [10, "morning"],
    [11, "midday"],
    [13, "midday"],
    [14, "afternoon"],
    [17, "afternoon"],
    [18, "evening"],
    [21, "evening"],
    [22, "night"],
    [0, "night"],
  ] as const)("hour %i -> %s", (hour, label) => {
    expect(labelForHour(hour)).toBe(label);
  });
});

describe("nextOccurrenceOfHour", () => {
  it("returns today when the hour hasn't happened yet", () => {
    const now = new Date("2026-08-28T11:30:00Z");
    const result = nextOccurrenceOfHour(now, 12);
    expect(result.toISOString()).toBe("2026-08-28T12:00:00.000Z");
  });

  it("rolls to tomorrow when the hour has already passed", () => {
    const now = new Date("2026-08-28T12:30:00Z");
    const result = nextOccurrenceOfHour(now, 12);
    expect(result.toISOString()).toBe("2026-08-29T12:00:00.000Z");
  });

  it("rolls to tomorrow exactly at the boundary (candidate === now)", () => {
    const now = new Date("2026-08-28T12:00:00.000Z");
    const result = nextOccurrenceOfHour(now, 12);
    expect(result.toISOString()).toBe("2026-08-29T12:00:00.000Z");
  });
});

describe("suggestPumpSlots", () => {
  const now = new Date("2026-08-28T12:00:00Z");

  it("returns no slots and null goal fields with no data", () => {
    const result = suggestPumpSlots({ nursingStartTimes: [], pumpHistory: [], now });
    expect(result.slots).toEqual([]);
    expect(result.mlStillNeededForGoal).toBeNull();
    expect(result.daysUntilReturnToWork).toBeNull();
  });

  describe("gap-between-feeds", () => {
    it("suggests a slot at the midpoint of the longest gap >= 4h", () => {
      const start = new Date("2026-08-28T02:00:00Z");
      const end = new Date("2026-08-28T07:00:00Z"); // 300 min (5h) gap
      const result = suggestPumpSlots({ nursingStartTimes: [start, end], pumpHistory: [], now });
      const slot = result.slots.find((s) => s.reason === "gap-between-feeds");
      expect(slot).toBeDefined();
      // midpoint = 04:30, hour 4 -> "night" label, next occurrence today at 04:00 has passed -> tomorrow
      expect(slot!.label).toBe("night");
    });

    it("does not suggest a gap slot under the 4h threshold", () => {
      const start = new Date("2026-08-28T02:00:00Z");
      const end = new Date("2026-08-28T04:30:00Z"); // 150 min gap
      const result = suggestPumpSlots({ nursingStartTimes: [start, end], pumpHistory: [], now });
      expect(result.slots.find((s) => s.reason === "gap-between-feeds")).toBeUndefined();
    });

    it("ignores gaps outside the 72h lookback window", () => {
      const start = new Date("2026-08-01T00:00:00Z");
      const end = new Date("2026-08-01T06:00:00Z"); // big gap but weeks before `now`
      const result = suggestPumpSlots({ nursingStartTimes: [start, end], pumpHistory: [], now });
      expect(result.slots.find((s) => s.reason === "gap-between-feeds")).toBeUndefined();
    });

    it("needs at least 2 nursing samples to compute a gap", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [new Date("2026-08-28T07:00:00Z")],
        pumpHistory: [],
        now,
      });
      expect(result.slots.find((s) => s.reason === "gap-between-feeds")).toBeUndefined();
    });
  });

  describe("morning-surplus", () => {
    it("suggests the morning hour with a meaningfully higher average than the day overall", () => {
      const pumpHistory = [
        { at: new Date("2026-08-27T06:00:00Z"), totalMl: 150 },
        { at: new Date("2026-08-28T06:15:00Z"), totalMl: 160 },
        { at: new Date("2026-08-27T14:00:00Z"), totalMl: 80 },
        { at: new Date("2026-08-28T14:10:00Z"), totalMl: 90 },
        { at: new Date("2026-08-27T20:00:00Z"), totalMl: 70 },
      ];
      const result = suggestPumpSlots({ nursingStartTimes: [], pumpHistory, now });
      const slot = result.slots.find((s) => s.reason === "morning-surplus");
      expect(slot).toBeDefined();
      expect(slot!.label).toBe("morning");
    });

    it("requires at least 2 samples in the candidate morning hour", () => {
      const pumpHistory = [
        { at: new Date("2026-08-27T06:00:00Z"), totalMl: 500 }, // single huge outlier sample
        { at: new Date("2026-08-27T14:00:00Z"), totalMl: 80 },
        { at: new Date("2026-08-28T14:10:00Z"), totalMl: 90 },
      ];
      const result = suggestPumpSlots({ nursingStartTimes: [], pumpHistory, now });
      expect(result.slots.find((s) => s.reason === "morning-surplus")).toBeUndefined();
    });

    it("does not suggest a morning slot when intake is roughly even across the day", () => {
      const pumpHistory = [
        { at: new Date("2026-08-27T06:00:00Z"), totalMl: 100 },
        { at: new Date("2026-08-28T06:15:00Z"), totalMl: 100 },
        { at: new Date("2026-08-27T14:00:00Z"), totalMl: 100 },
        { at: new Date("2026-08-28T14:10:00Z"), totalMl: 100 },
      ];
      const result = suggestPumpSlots({ nursingStartTimes: [], pumpHistory, now });
      expect(result.slots.find((s) => s.reason === "morning-surplus")).toBeUndefined();
    });

    it("needs at least 3 total pump samples before pattern-matching", () => {
      const pumpHistory = [
        { at: new Date("2026-08-27T06:00:00Z"), totalMl: 150 },
        { at: new Date("2026-08-28T06:15:00Z"), totalMl: 160 },
      ];
      const result = suggestPumpSlots({ nursingStartTimes: [], pumpHistory, now });
      expect(result.slots.find((s) => s.reason === "morning-surplus")).toBeUndefined();
    });
  });

  describe("stash goal for a return-to-work date", () => {
    it("suggests an evening slot when stash is short of the goal", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [],
        pumpHistory: [],
        now,
        returnToWorkDate: new Date("2026-09-15T00:00:00Z"),
        targetStashMl: 3000,
        currentStashMl: 1000,
      });
      expect(result.mlStillNeededForGoal).toBe(2000);
      expect(result.daysUntilReturnToWork).toBe(18);
      const slot = result.slots.find((s) => s.reason === "stash-goal");
      expect(slot).toBeDefined();
      expect(slot!.label).toBe("evening");
    });

    it("reports zero still needed, and adds no slot, once the goal is met", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [],
        pumpHistory: [],
        now,
        returnToWorkDate: new Date("2026-09-15T00:00:00Z"),
        targetStashMl: 1000,
        currentStashMl: 1500,
      });
      expect(result.mlStillNeededForGoal).toBe(0);
      expect(result.slots.find((s) => s.reason === "stash-goal")).toBeUndefined();
    });

    it("does not add a slot once the return date is today or in the past", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [],
        pumpHistory: [],
        now,
        returnToWorkDate: new Date("2026-08-20T00:00:00Z"),
        targetStashMl: 3000,
        currentStashMl: 1000,
      });
      expect(result.daysUntilReturnToWork).toBeLessThan(0);
      expect(result.slots.find((s) => s.reason === "stash-goal")).toBeUndefined();
    });

    it("leaves goal fields null when no return-to-work date is set", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [],
        pumpHistory: [],
        now,
        targetStashMl: 3000,
        currentStashMl: 1000,
      });
      expect(result.mlStillNeededForGoal).toBeNull();
      expect(result.daysUntilReturnToWork).toBeNull();
    });

    it("leaves mlStillNeededForGoal null when no target is set, even with a return date", () => {
      const result = suggestPumpSlots({
        nursingStartTimes: [],
        pumpHistory: [],
        now,
        returnToWorkDate: new Date("2026-09-15T00:00:00Z"),
      });
      expect(result.mlStillNeededForGoal).toBeNull();
      expect(result.daysUntilReturnToWork).toBe(18);
    });
  });
});
