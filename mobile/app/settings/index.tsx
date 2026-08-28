import React from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { useSettingsStore, ThemePreference, SupportedLanguage } from "@/store/useSettingsStore";
import { useEntitlementStore } from "@/store/useEntitlementStore";
import { VolumeUnit } from "@/domain/units";

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: "system", labelKey: "settings.themeSystem" },
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "night", labelKey: "settings.themeNight" },
];

const UNIT_OPTIONS: { value: VolumeUnit; labelKey: string }[] = [
  { value: "ml", labelKey: "settings.unitsMl" },
  { value: "oz", labelKey: "settings.unitsOz" },
];

const LANGUAGE_OPTIONS: { value: SupportedLanguage | "system"; label: string }[] = [
  { value: "system", label: "settings.languageSystem" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const unit = useSettingsStore((s) => s.unit);
  const setUnit = useSettingsStore((s) => s.setUnit);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const returnToWorkDate = useSettingsStore((s) => s.returnToWorkDate);
  const setReturnToWorkDate = useSettingsStore((s) => s.setReturnToWorkDate);
  const targetStashMl = useSettingsStore((s) => s.targetStashMl);
  const setTargetStashMl = useSettingsStore((s) => s.setTargetStashMl);
  const isUnlocked = useEntitlementStore((s) => s.isUnlocked);
  const restore = useEntitlementStore((s) => s.restore);

  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md }}>
        <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("settings.title")}</Text>

        <Section title={t("settings.appearance")}>
          <OptionRow>
            {THEME_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={t(opt.labelKey)}
                tone="accent"
                variant={themePreference === opt.value ? "solid" : "outline"}
                active={themePreference === opt.value}
                onPress={() => setThemePreference(opt.value)}
              />
            ))}
          </OptionRow>
        </Section>

        <Section title={t("settings.units")}>
          <OptionRow>
            {UNIT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={t(opt.labelKey)}
                tone="accent"
                variant={unit === opt.value ? "solid" : "outline"}
                active={unit === opt.value}
                onPress={() => setUnit(opt.value)}
              />
            ))}
          </OptionRow>
        </Section>

        <Section title={t("settings.language")}>
          <OptionRow>
            {LANGUAGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                testID={`settings-language-option-${opt.value}`}
                label={opt.value === "system" ? t(opt.label) : opt.label}
                tone="accent"
                variant={language === opt.value ? "solid" : "outline"}
                active={language === opt.value}
                onPress={() => setLanguage(opt.value)}
              />
            ))}
          </OptionRow>
        </Section>

        <Section title={t("settings.returnToWork")}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{t("settings.returnToWorkNote")}</Text>
          <TextInput
            value={returnToWorkDate ?? ""}
            onChangeText={(text) => setReturnToWorkDate(text.trim() || null)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textMuted}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              padding: theme.spacing.sm,
              color: theme.colors.textPrimary,
              marginTop: theme.spacing.xs,
            }}
          />
          <Text style={[theme.type.caption, { color: theme.colors.textMuted, marginTop: theme.spacing.sm }]}>
            {t("settings.targetStash", { unit })}
          </Text>
          <TextInput
            value={targetStashMl != null ? String(targetStashMl) : ""}
            onChangeText={(text) => {
              const value = Number(text);
              setTargetStashMl(text.trim() && !Number.isNaN(value) ? value : null);
            }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              padding: theme.spacing.sm,
              color: theme.colors.textPrimary,
              marginTop: theme.spacing.xs,
            }}
          />
        </Section>

        <Section title={t("settings.queenUnlock")}>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
            {isUnlocked ? t("settings.queenUnlockOwned") : t("recommendations.unlockPrompt")}
          </Text>
          {!isUnlocked ? <Button label={t("settings.restorePurchases")} tone="neutral" variant="outline" onPress={() => void restore()} /> : null}
        </Section>

        <Section title={t("settings.about")}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t("settings.version", { version: Constants.expoConfig?.version ?? "1.0.0" })}
          </Text>
        </Section>
      </ScrollView>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      {children}
    </Card>
  );
}

function OptionRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs }}>{children}</View>;
}
