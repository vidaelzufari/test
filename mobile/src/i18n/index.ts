import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const;
export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export const RTL_LANGUAGES: SupportedLanguageCode[] = ["ar"];

const resources = { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } };

export function resolveDeviceLanguage(): SupportedLanguageCode {
  const deviceTags = Localization.getLocales().map((l) => l.languageCode);
  const match = deviceTags.find((tag): tag is SupportedLanguageCode =>
    SUPPORTED_LANGUAGES.includes(tag as SupportedLanguageCode)
  );
  return match ?? "en";
}

let initialized = false;

export function initI18n(preferredLanguage?: SupportedLanguageCode): void {
  const language = preferredLanguage ?? resolveDeviceLanguage();
  if (!initialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: "en",
      compatibilityJSON: "v3",
      interpolation: { escapeValue: false },
    });
    initialized = true;
  } else {
    i18n.changeLanguage(language);
  }
  applyDirection(language);
}

/**
 * Mirrors the whole layout for Arabic. Flipping I18nManager only takes full
 * effect after a reload, which we force once per actual change — RTL must
 * be tested by actually switching language and relaunching, not just by
 * eyeballing flex-direction in isolation.
 */
export function applyDirection(language: SupportedLanguageCode): void {
  const shouldBeRTL = RTL_LANGUAGES.includes(language);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

export default i18n;
