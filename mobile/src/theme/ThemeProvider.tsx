import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { ColorTokens, ThemeMode, palettes, radii, shadows, spacing, typeScale } from "./tokens";
import { useSettingsStore } from "@/store/useSettingsStore";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  type: typeof typeScale;
  shadows: typeof shadows;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);

  const mode: ThemeMode = useMemo(() => {
    if (themePreference === "night") return "night";
    if (themePreference === "light") return "light";
    if (themePreference === "dark") return "dark";
    return systemScheme === "dark" ? "dark" : "light";
  }, [themePreference, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palettes[mode],
      spacing,
      radii,
      type: typeScale,
      shadows,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
