/**
 * Design tokens — the single file every component and screen pulls colors,
 * spacing, radii, and type from. Three palettes: light, dark, and an
 * extra-dim "night" variant for 3am sessions (lower brightness + warmer,
 * lower-contrast tones so it doesn't wake anyone up).
 */

export type ThemeMode = "light" | "dark" | "night";

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentContrast: string;
  crown: string;
  nursing: string;
  pumping: string;
  bottle: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
}

const light: ColorTokens = {
  background: "#FBF7F4",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFDFB",
  border: "#EDE1D8",
  textPrimary: "#2B2320",
  textSecondary: "#6B5E56",
  textMuted: "#A79A90",
  accent: "#B8875B",
  accentContrast: "#FFFFFF",
  crown: "#C9A15A",
  nursing: "#C97B84",
  pumping: "#7C93A8",
  bottle: "#8FAE8B",
  success: "#5E9C76",
  warning: "#D0973F",
  danger: "#C4594F",
  overlay: "rgba(43, 35, 32, 0.45)",
};

const dark: ColorTokens = {
  background: "#171310",
  surface: "#221D19",
  surfaceRaised: "#2B2521",
  border: "#3A322C",
  textPrimary: "#F3ECE5",
  textSecondary: "#C7B9AE",
  textMuted: "#8B7E74",
  accent: "#D9AA76",
  accentContrast: "#241A0F",
  crown: "#E0BD7C",
  nursing: "#D992A0",
  pumping: "#93AEC4",
  bottle: "#A3C89D",
  success: "#7BB894",
  warning: "#E0AC5F",
  danger: "#DE857A",
  overlay: "rgba(0, 0, 0, 0.6)",
};

/** Extra-dim, warm, low-blue-light variant for overnight feeds. */
const night: ColorTokens = {
  background: "#0B0908",
  surface: "#151110",
  surfaceRaised: "#1C1715",
  border: "#2A2320",
  textPrimary: "#C9BDB0",
  textSecondary: "#8F8175",
  textMuted: "#5C5249",
  accent: "#A97B4F",
  accentContrast: "#0B0908",
  crown: "#8A6B3D",
  nursing: "#8C5A5F",
  pumping: "#5E6E7C",
  bottle: "#5F7A5C",
  success: "#4F7A61",
  warning: "#8F6C3B",
  danger: "#8F5049",
  overlay: "rgba(0, 0, 0, 0.75)",
};

export const palettes: Record<ThemeMode, ColorTokens> = { light, dark, night };

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typeScale = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;

/** Minimum thumb-reachable hit target, per the product brief. */
export const MIN_TOUCH_TARGET = 60;

export const shadows = {
  card: {
    shadowColor: "#2B2320",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;
