import { BottleEvent, NursingSession, PumpEvent } from "@/db/types";
import { computeStatusStrip } from "@/store/useLogStore";

function nursing(overrides: Partial<NursingSession>): NursingSession {
  return {
    id: overrides.id ?? "n1",
    babyId: "baby-1",
    side: overrides.side ?? "left",
    startedAt: overrides.startedAt ?? new Date().toISOString(),
    endedAt: overrides.endedAt ?? null,
    durationSeconds: overrides.durationSeconds ?? null,
    note: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function bottle(overrides: Partial<BottleEvent>): BottleEvent {
  return {
    id: overrides.id ?? "b1",
    babyId: "baby-1",
    ml: overrides.ml ?? 100,
    milkType: "breast_milk",
    needsDetail: false,
    stashItemId: null,
    note: null,
    occurredAt: overrides.occurredAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function pump(overrides: Partial<PumpEvent>): PumpEvent {
  return {
    id: overrides.id ?? "p1",
    babyId: "baby-1",
    startedAt: overrides.startedAt ?? new Date().toISOString(),
    leftMl: overrides.leftMl ?? null,
    rightMl: overrides.rightMl ?? null,
    totalMl: overrides.totalMl ?? null,
    needsDetail: overrides.totalMl == null,
    note: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeStatusStrip", () => {
  const now = new Date("2026-08-28T15:00:00Z");

  it("picks the most recent feed across nursing and bottle sources", () => {
    const nursingSessions = [nursing({ id: "n1", startedAt: "2026-08-28T10:00:00Z", side: "left" })];
    const bottleEvents = [bottle({ id: "b1", occurredAt: "2026-08-28T14:00:00Z" })];
    const result = computeStatusStrip(nursingSessions, [], bottleEvents, now);
    expect(result.lastFeedAt?.toISOString()).toBe("2026-08-28T14:00:00.000Z");
  });

  it("reports the side from the most recent nursing session regardless of bottle recency", () => {
    const nursingSessions = [nursing({ id: "n1", startedAt: "2026-08-28T10:00:00Z", side: "right" })];
    const bottleEvents = [bottle({ id: "b1", occurredAt: "2026-08-28T14:00:00Z" })];
    const result = computeStatusStrip(nursingSessions, [], bottleEvents, now);
    expect(result.lastNursingSide).toBe("right");
  });

  it("returns null lastFeedAt with no data at all", () => {
    const result = computeStatusStrip([], [], [], now);
    expect(result.lastFeedAt).toBeNull();
    expect(result.lastNursingSide).toBeNull();
  });

  it("only counts today's entries toward today's totals", () => {
    const nursingSessions = [
      nursing({ id: "today", startedAt: "2026-08-28T09:00:00Z" }),
      nursing({ id: "yesterday", startedAt: "2026-08-27T09:00:00Z" }),
    ];
    const bottleEvents = [
      bottle({ id: "today", ml: 90, occurredAt: "2026-08-28T08:00:00Z" }),
      bottle({ id: "yesterday", ml: 999, occurredAt: "2026-08-27T08:00:00Z" }),
    ];
    const pumpEvents = [
      pump({ id: "today", totalMl: 120, startedAt: "2026-08-28T07:00:00Z" }),
      pump({ id: "yesterday", totalMl: 999, startedAt: "2026-08-27T07:00:00Z" }),
    ];
    const result = computeStatusStrip(nursingSessions, pumpEvents, bottleEvents, now);
    expect(result.todayNursingCount).toBe(1);
    expect(result.todayBottleMl).toBe(90);
    expect(result.todayPumpMl).toBe(120);
  });

  it("treats a pump event pending detail (null totalMl) as 0 ml, not a crash", () => {
    const pumpEvents = [pump({ id: "pending", totalMl: null, startedAt: "2026-08-28T07:00:00Z" })];
    const result = computeStatusStrip([], pumpEvents, [], now);
    expect(result.todayPumpMl).toBe(0);
  });
});
