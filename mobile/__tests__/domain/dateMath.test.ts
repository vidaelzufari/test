import { computeAge, formatDurationShort, minutesSince, weeksSinceBirth } from "@/domain/dateMath";

describe("dateMath", () => {
  describe("computeAge", () => {
    it("computes days/weeks/months for a newborn", () => {
      const dob = new Date("2026-08-01T00:00:00Z");
      const now = new Date("2026-08-08T00:00:00Z");
      const age = computeAge(dob, now);
      expect(age.days).toBe(7);
      expect(age.weeks).toBe(1);
      expect(age.isMonthsPhase).toBe(false);
    });

    it("flips to isMonthsPhase at 8 weeks", () => {
      const dob = new Date("2026-01-01T00:00:00Z");
      const now = new Date("2026-02-26T00:00:00Z"); // 56 days = 8 weeks
      const age = computeAge(dob, now);
      expect(age.weeks).toBe(8);
      expect(age.isMonthsPhase).toBe(true);
    });

    it("never returns negative age for a future-clock edge case", () => {
      const dob = new Date("2026-08-10T00:00:00Z");
      const now = new Date("2026-08-01T00:00:00Z");
      const age = computeAge(dob, now);
      expect(age.days).toBe(0);
      expect(age.weeks).toBe(0);
      expect(age.months).toBe(0);
    });

    it("computes whole months correctly", () => {
      const dob = new Date("2026-01-15T00:00:00Z");
      const now = new Date("2026-04-20T00:00:00Z");
      const age = computeAge(dob, now);
      expect(age.months).toBe(3);
    });
  });

  describe("minutesSince", () => {
    it("computes elapsed minutes", () => {
      const from = new Date("2026-08-28T10:00:00Z");
      const now = new Date("2026-08-28T10:45:00Z");
      expect(minutesSince(from, now)).toBe(45);
    });

    it("clamps to zero when now is before from", () => {
      const from = new Date("2026-08-28T10:45:00Z");
      const now = new Date("2026-08-28T10:00:00Z");
      expect(minutesSince(from, now)).toBe(0);
    });
  });

  describe("weeksSinceBirth", () => {
    it("floors to whole weeks", () => {
      const dob = new Date("2026-08-01T00:00:00Z");
      const now = new Date("2026-08-13T00:00:00Z"); // 12 days
      expect(weeksSinceBirth(dob, now)).toBe(1);
    });
  });

  describe("formatDurationShort", () => {
    it("formats sub-hour durations as minutes only", () => {
      expect(formatDurationShort(45)).toBe("45m");
      expect(formatDurationShort(0)).toBe("0m");
    });

    it("formats whole hours without minutes", () => {
      expect(formatDurationShort(120)).toBe("2h");
    });

    it("formats hours and minutes together", () => {
      expect(formatDurationShort(125)).toBe("2h 5m");
    });
  });
});
