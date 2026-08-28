import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { VolumeUnit } from "@/domain/units";
import { ThemeMode } from "@/theme/tokens";

export type ThemePreference = ThemeMode | "system";
export type SupportedLanguage = "en" | "fr" | "ar";

interface SettingsState {
  themePreference: ThemePreference;
  unit: VolumeUnit;
  language: SupportedLanguage | "system";
  activeBabyId: string | null;
  /** Set from Settings if the mother wants pump-slot + stash-goal guidance. */
  returnToWorkDate: string | null; // ISO date
  targetStashMl: number | null;
  hasCompletedOnboarding: boolean;
  setThemePreference: (mode: ThemePreference) => void;
  setUnit: (unit: VolumeUnit) => void;
  setLanguage: (language: SupportedLanguage | "system") => void;
  setActiveBabyId: (id: string | null) => void;
  setReturnToWorkDate: (iso: string | null) => void;
  setTargetStashMl: (ml: number | null) => void;
  completeOnboarding: () => void;
}

/**
 * Non-health app preferences only. Persisted via AsyncStorage (not SQLite) —
 * safe to lose in the worst case, unlike feeding/pump/stash data, which
 * always lives in the SQLite repository layer instead.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: "system",
      unit: "ml",
      language: "system",
      activeBabyId: null,
      returnToWorkDate: null,
      targetStashMl: null,
      hasCompletedOnboarding: false,
      setThemePreference: (mode) => set({ themePreference: mode }),
      setUnit: (unit) => set({ unit }),
      setLanguage: (language) => set({ language }),
      setActiveBabyId: (id) => set({ activeBabyId: id }),
      setReturnToWorkDate: (iso) => set({ returnToWorkDate: iso }),
      setTargetStashMl: (ml) => set({ targetStashMl: ml }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: "nursing-queen-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
