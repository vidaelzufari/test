import { create } from "zustand";
import { babyRepository } from "@/db/repositories";
import { Baby } from "@/db/types";
import { useSettingsStore } from "./useSettingsStore";

interface BabyState {
  babies: Baby[];
  loaded: boolean;
  refresh: () => void;
  activeBaby: () => Baby | null;
  createBaby: (input: { name: string; dateOfBirth: string; photoUri?: string | null }) => Baby;
  updateBaby: (id: string, patch: Partial<Pick<Baby, "name" | "dateOfBirth" | "photoUri">>) => void;
  switchActiveBaby: (id: string) => void;
}

export const useBabyStore = create<BabyState>()((set, get) => ({
  babies: [],
  loaded: false,

  refresh: () => {
    const babies = babyRepository.listAll();
    set({ babies, loaded: true });
    const { activeBabyId, setActiveBabyId } = useSettingsStore.getState();
    if (babies.length > 0 && (!activeBabyId || !babies.some((b) => b.id === activeBabyId))) {
      setActiveBabyId(babies[0]!.id);
    }
  },

  activeBaby: () => {
    const { activeBabyId } = useSettingsStore.getState();
    return get().babies.find((b) => b.id === activeBabyId) ?? get().babies[0] ?? null;
  },

  createBaby: (input) => {
    const baby = babyRepository.create(input);
    get().refresh();
    useSettingsStore.getState().setActiveBabyId(baby.id);
    return baby;
  },

  updateBaby: (id, patch) => {
    babyRepository.update(id, patch);
    get().refresh();
  },

  switchActiveBaby: (id) => {
    useSettingsStore.getState().setActiveBabyId(id);
  },
}));
