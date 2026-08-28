import { create } from "zustand";
import { stashRepository } from "@/db/repositories";
import { MilkType, StashItem, StashLocation, StashStatus } from "@/db/types";
import { canTransitionStashStatus } from "@/domain/recommendations";

interface StashState {
  babyId: string | null;
  items: StashItem[];
  refresh: (babyId: string) => void;
  addToStash: (input: { ml: number; milkType: MilkType; pumpedAt: Date; location: StashLocation }) => void;
  transitionStatus: (id: string, to: StashStatus, thawedAt?: Date) => void;
}

export const useStashStore = create<StashState>()((set, get) => ({
  babyId: null,
  items: [],

  refresh: (babyId) => {
    set({ babyId, items: stashRepository.listByBaby(babyId) });
  },

  addToStash: (input) => {
    const { babyId } = get();
    if (!babyId) return;
    stashRepository.create({ babyId, ...input });
    get().refresh(babyId);
  },

  transitionStatus: (id, to, thawedAt) => {
    const { babyId, items } = get();
    const current = items.find((i) => i.id === id);
    if (!current || !babyId) return;
    if (!canTransitionStashStatus(current.status, to)) return;
    stashRepository.setStatus(id, to, to === "thawed" ? thawedAt ?? new Date() : null);
    get().refresh(babyId);
  },
}));
