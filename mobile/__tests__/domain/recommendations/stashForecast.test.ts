import { addDays, addHours, addMonths, subDays, subHours } from "date-fns";
import { StashItem } from "@/db/types";
import {
  canTransitionStashStatus,
  computeItemExpiry,
  computeStashForecast,
} from "@/domain/recommendations/stashForecast";

function makeItem(overrides: Partial<StashItem>): StashItem {
  return {
    id: overrides.id ?? "item-1",
    babyId: "baby-1",
    ml: overrides.ml ?? 100,
    milkType: "breast_milk",
    pumpedAt: overrides.pumpedAt ?? new Date("2026-08-01T00:00:00Z").toISOString(),
    location: overrides.location ?? "fridge",
    status: overrides.status ?? "available",
    thawedAt: overrides.thawedAt ?? null,
    createdAt: new Date("2026-08-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-08-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}

describe("computeItemExpiry", () => {
  describe("fridge (4-day window)", () => {
    it("is fresh well within the window", () => {
      const pumpedAt = new Date("2026-08-27T00:00:00Z");
      const now = addDays(pumpedAt, 1); // 3 of 4 days remain
      const result = computeItemExpiry(makeItem({ location: "fridge", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("fresh");
      expect(result.reasonCode).toBe("fridge_4_days");
    });

    it("is expiring_soon inside the last 20% of the window", () => {
      const pumpedAt = new Date("2026-08-27T00:00:00Z");
      const now = addHours(pumpedAt, 4 * 24 - 12); // 12h of 96h remain (< 19.2h threshold... use tighter)
      const result = computeItemExpiry(makeItem({ location: "fridge", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expiring_soon");
    });

    it("is expired after 4 days", () => {
      const pumpedAt = new Date("2026-08-20T00:00:00Z");
      const now = addDays(pumpedAt, 5);
      const result = computeItemExpiry(makeItem({ location: "fridge", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expired");
    });
  });

  describe("counter (4-hour window)", () => {
    it("is fresh shortly after pumping", () => {
      const pumpedAt = new Date("2026-08-28T09:00:00Z");
      const now = addHours(pumpedAt, 1);
      const result = computeItemExpiry(makeItem({ location: "counter", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("fresh");
      expect(result.reasonCode).toBe("counter_4_hours");
    });

    it("is expired past 4 hours at room temperature", () => {
      const pumpedAt = new Date("2026-08-28T09:00:00Z");
      const now = addHours(pumpedAt, 5);
      const result = computeItemExpiry(makeItem({ location: "counter", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expired");
    });
  });

  describe("thawed (24-hour window, never refreeze)", () => {
    it("counts down from thawedAt, not pumpedAt", () => {
      const pumpedAt = new Date("2026-08-01T00:00:00Z");
      const thawedAt = new Date("2026-08-27T00:00:00Z");
      const now = addHours(thawedAt, 1);
      const result = computeItemExpiry(
        makeItem({
          location: "freezer",
          status: "thawed",
          pumpedAt: pumpedAt.toISOString(),
          thawedAt: thawedAt.toISOString(),
        }),
        now
      );
      expect(result.state).toBe("fresh");
      expect(result.reasonCode).toBe("thawed_24_hours");
      expect(result.expiresAt.toISOString()).toBe(addHours(thawedAt, 24).toISOString());
    });

    it("falls back to pumpedAt if thawedAt is missing", () => {
      const pumpedAt = new Date("2026-08-27T00:00:00Z");
      const now = addHours(pumpedAt, 1);
      const result = computeItemExpiry(
        makeItem({ status: "thawed", pumpedAt: pumpedAt.toISOString(), thawedAt: null }),
        now
      );
      expect(result.state).toBe("fresh");
    });

    it("is expired 24+ hours after thawing", () => {
      const thawedAt = new Date("2026-08-27T00:00:00Z");
      const now = addHours(thawedAt, 25);
      const result = computeItemExpiry(
        makeItem({ status: "thawed", pumpedAt: thawedAt.toISOString(), thawedAt: thawedAt.toISOString() }),
        now
      );
      expect(result.state).toBe("expired");
    });
  });

  describe("freezer (6-month best, 12-month acceptable)", () => {
    const pumpedAt = new Date("2026-01-01T00:00:00Z");
    const bestDeadline = addMonths(pumpedAt, 6);
    const acceptableDeadline = addMonths(pumpedAt, 12);

    it("is fresh well before the best-by date", () => {
      const now = subDays(bestDeadline, 60);
      const result = computeItemExpiry(makeItem({ location: "freezer", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("fresh");
      expect(result.reasonCode).toBe("freezer_6_months_best");
    });

    it("is expiring_soon inside the last 20% before the best-by date", () => {
      const now = subDays(bestDeadline, 10);
      const result = computeItemExpiry(makeItem({ location: "freezer", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expiring_soon");
      expect(result.reasonCode).toBe("freezer_6_months_best");
    });

    it("is still expiring_soon (acceptable, not ideal) between best-by and the 12-month cutoff", () => {
      const now = addDays(bestDeadline, 5);
      const result = computeItemExpiry(makeItem({ location: "freezer", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expiring_soon");
      expect(result.reasonCode).toBe("freezer_6_months_best");
      expect(result.expiresAt.toISOString()).toBe(bestDeadline.toISOString());
    });

    it("is expired past the 12-month acceptable cutoff", () => {
      const now = addDays(acceptableDeadline, 1);
      const result = computeItemExpiry(makeItem({ location: "freezer", pumpedAt: pumpedAt.toISOString() }), now);
      expect(result.state).toBe("expired");
      expect(result.reasonCode).toBe("freezer_12_months_acceptable");
      expect(result.expiresAt.toISOString()).toBe(acceptableDeadline.toISOString());
    });
  });
});

describe("computeStashForecast", () => {
  const now = new Date("2026-08-28T12:00:00Z");

  it("totals only available/thawed items, excluding used and discarded", () => {
    const items: StashItem[] = [
      makeItem({ id: "a", ml: 100, status: "available", pumpedAt: subDays(now, 1).toISOString() }),
      makeItem({ id: "b", ml: 50, status: "thawed", pumpedAt: subDays(now, 2).toISOString() }),
      makeItem({ id: "c", ml: 999, status: "used", pumpedAt: subDays(now, 3).toISOString() }),
      makeItem({ id: "d", ml: 999, status: "discarded", pumpedAt: subDays(now, 4).toISOString() }),
    ];
    const forecast = computeStashForecast(items, now, null);
    expect(forecast.totalMl).toBe(150);
  });

  it("computes days of coverage from actual average daily intake", () => {
    const items: StashItem[] = [makeItem({ ml: 600, pumpedAt: subDays(now, 1).toISOString() })];
    const forecast = computeStashForecast(items, now, 200);
    expect(forecast.daysOfCoverage).toBe(3);
  });

  it("leaves days of coverage null when intake is unknown or zero", () => {
    const items: StashItem[] = [makeItem({ ml: 600 })];
    expect(computeStashForecast(items, now, null).daysOfCoverage).toBeNull();
    expect(computeStashForecast(items, now, 0).daysOfCoverage).toBeNull();
  });

  it("suggests the oldest active item first", () => {
    const items: StashItem[] = [
      makeItem({ id: "newer", pumpedAt: subDays(now, 1).toISOString() }),
      makeItem({ id: "oldest", pumpedAt: subDays(now, 10).toISOString() }),
      makeItem({ id: "used-but-oldest", status: "used", pumpedAt: subDays(now, 30).toISOString() }),
    ];
    const forecast = computeStashForecast(items, now, null);
    expect(forecast.useNextItemId).toBe("oldest");
  });

  it("returns null useNextItemId when there is no active stash", () => {
    const forecast = computeStashForecast([], now, null);
    expect(forecast.useNextItemId).toBeNull();
  });

  it("buckets expiring and expired items separately", () => {
    const items: StashItem[] = [
      makeItem({ id: "fresh", location: "fridge", pumpedAt: subHours(now, 2).toISOString() }),
      makeItem({ id: "soon", location: "fridge", pumpedAt: subHours(now, 4 * 24 - 1).toISOString() }),
      makeItem({ id: "gone", location: "fridge", pumpedAt: subDays(now, 10).toISOString() }),
    ];
    const forecast = computeStashForecast(items, now, null);
    expect(forecast.expiring.map((e) => e.item.id)).toEqual(["soon"]);
    expect(forecast.expired.map((e) => e.item.id)).toEqual(["gone"]);
  });
});

describe("canTransitionStashStatus", () => {
  it("allows available -> thawed, used, or discarded", () => {
    expect(canTransitionStashStatus("available", "thawed")).toBe(true);
    expect(canTransitionStashStatus("available", "used")).toBe(true);
    expect(canTransitionStashStatus("available", "discarded")).toBe(true);
  });

  it("allows thawed -> used or discarded, but never back to storage (no refreezing)", () => {
    expect(canTransitionStashStatus("thawed", "used")).toBe(true);
    expect(canTransitionStashStatus("thawed", "discarded")).toBe(true);
    expect(canTransitionStashStatus("thawed", "available")).toBe(false);
  });

  it("treats used and discarded as terminal states", () => {
    expect(canTransitionStashStatus("used", "available")).toBe(false);
    expect(canTransitionStashStatus("used", "thawed")).toBe(false);
    expect(canTransitionStashStatus("discarded", "available")).toBe(false);
  });

  it("treats a same-state transition as a no-op success", () => {
    expect(canTransitionStashStatus("available", "available")).toBe(true);
    expect(canTransitionStashStatus("thawed", "thawed")).toBe(true);
  });
});
