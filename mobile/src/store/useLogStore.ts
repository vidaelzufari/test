import { create } from "zustand";
import { isSameDay } from "date-fns";
import {
  bottleRepository,
  nursingRepository,
  pumpRepository,
} from "@/db/repositories";
import { BottleEvent, MilkType, NursingSession, NursingSide, PumpEvent } from "@/db/types";

interface LogState {
  babyId: string | null;
  nursingSessions: NursingSession[];
  pumpEvents: PumpEvent[];
  bottleEvents: BottleEvent[];

  refresh: (babyId: string) => void;
  openNursingSession: () => NursingSession | null;

  // Zero-friction capture actions — every one saves immediately, no form.
  startNursing: (side?: NursingSide) => void;
  stopNursing: () => void;
  logNursingPreset: (minutes: number, side?: NursingSide) => void;
  logPump: () => PumpEvent;
  addPumpDetail: (id: string, leftMl: number | null, rightMl: number | null) => void;
  logBottle: (ml: number | null, milkType: MilkType) => BottleEvent;

  updateNursing: (id: string, patch: Partial<Pick<NursingSession, "side" | "startedAt" | "endedAt" | "durationSeconds" | "note">>) => void;
  updatePump: (id: string, patch: Partial<Pick<PumpEvent, "startedAt" | "leftMl" | "rightMl" | "note">>) => void;
  updateBottle: (id: string, patch: Partial<Pick<BottleEvent, "ml" | "milkType" | "occurredAt" | "note">>) => void;

  deleteNursing: (id: string) => void;
  deletePump: (id: string) => void;
  deleteBottle: (id: string) => void;
}

export const useLogStore = create<LogState>()((set, get) => ({
  babyId: null,
  nursingSessions: [],
  pumpEvents: [],
  bottleEvents: [],

  refresh: (babyId) => {
    set({
      babyId,
      nursingSessions: nursingRepository.listByBaby(babyId),
      pumpEvents: pumpRepository.listByBaby(babyId),
      bottleEvents: bottleRepository.listByBaby(babyId),
    });
  },

  openNursingSession: () => get().nursingSessions.find((s) => s.endedAt === null) ?? null,

  startNursing: (side = "unknown") => {
    const { babyId } = get();
    if (!babyId) return;
    nursingRepository.startSession(babyId, side);
    get().refresh(babyId);
  },

  stopNursing: () => {
    const { babyId } = get();
    if (!babyId) return;
    const open = get().openNursingSession();
    if (open) {
      nursingRepository.stopSession(open.id);
    }
    get().refresh(babyId);
  },

  logNursingPreset: (minutes, side = "unknown") => {
    const { babyId } = get();
    if (!babyId) return;
    nursingRepository.logCompletedSession(babyId, minutes * 60, side);
    get().refresh(babyId);
  },

  logPump: () => {
    const { babyId } = get();
    if (!babyId) throw new Error("No active baby");
    const event = pumpRepository.logPending(babyId);
    get().refresh(babyId);
    return event;
  },

  addPumpDetail: (id, leftMl, rightMl) => {
    const { babyId } = get();
    pumpRepository.addDetail(id, leftMl, rightMl);
    if (babyId) get().refresh(babyId);
  },

  logBottle: (ml, milkType) => {
    const { babyId } = get();
    if (!babyId) throw new Error("No active baby");
    const event = bottleRepository.create({ babyId, ml, milkType });
    get().refresh(babyId);
    return event;
  },

  updateNursing: (id, patch) => {
    const { babyId } = get();
    nursingRepository.update(id, patch);
    if (babyId) get().refresh(babyId);
  },
  updatePump: (id, patch) => {
    const { babyId } = get();
    pumpRepository.update(id, patch);
    if (babyId) get().refresh(babyId);
  },
  updateBottle: (id, patch) => {
    const { babyId } = get();
    bottleRepository.update(id, patch);
    if (babyId) get().refresh(babyId);
  },

  deleteNursing: (id) => {
    const { babyId } = get();
    nursingRepository.delete(id);
    if (babyId) get().refresh(babyId);
  },
  deletePump: (id) => {
    const { babyId } = get();
    pumpRepository.delete(id);
    if (babyId) get().refresh(babyId);
  },
  deleteBottle: (id) => {
    const { babyId } = get();
    bottleRepository.delete(id);
    if (babyId) get().refresh(babyId);
  },
}));

export interface StatusStripData {
  lastFeedAt: Date | null;
  lastNursingSide: NursingSide | null;
  todayNursingCount: number;
  todayPumpMl: number;
  todayBottleMl: number;
}

/** Pure derivation so it's trivially testable without touching the store/db. */
export function computeStatusStrip(
  nursingSessions: NursingSession[],
  pumpEvents: PumpEvent[],
  bottleEvents: BottleEvent[],
  now: Date
): StatusStripData {
  const lastNursing = nursingSessions[0] ?? null;
  const lastBottle = bottleEvents[0] ?? null;
  const candidates: { at: Date; kind: "nursing" | "bottle" }[] = [];
  if (lastNursing) candidates.push({ at: new Date(lastNursing.startedAt), kind: "nursing" });
  if (lastBottle) candidates.push({ at: new Date(lastBottle.occurredAt), kind: "bottle" });
  candidates.sort((a, b) => b.at.getTime() - a.at.getTime());
  const lastFeed = candidates[0] ?? null;

  const todayNursingCount = nursingSessions.filter((s) => isSameDay(new Date(s.startedAt), now)).length;
  const todayPumpMl = pumpEvents
    .filter((p) => isSameDay(new Date(p.startedAt), now))
    .reduce((sum, p) => sum + (p.totalMl ?? 0), 0);
  const todayBottleMl = bottleEvents
    .filter((b) => isSameDay(new Date(b.occurredAt), now))
    .reduce((sum, b) => sum + (b.ml ?? 0), 0);

  return {
    lastFeedAt: lastFeed?.at ?? null,
    lastNursingSide: lastNursing?.side ?? null,
    todayNursingCount,
    todayPumpMl,
    todayBottleMl,
  };
}
