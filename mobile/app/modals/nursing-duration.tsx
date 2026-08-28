import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components";
import { useLogStore } from "@/store/useLogStore";

const PRESET_MINUTES = [5, 10, 15, 20];

/** Reached only when "Stopped Nursing" is tapped with no session open — logs a completed feed retroactively. */
export default function NursingDurationModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const logNursingPreset = useLogStore((s) => s.logNursingPreset);

  const handlePreset = (minutes: number) => {
    logNursingPreset(minutes);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: "center", gap: theme.spacing.md }}>
      <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("home.chooseDuration")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {PRESET_MINUTES.map((minutes) => (
          <Button
            key={minutes}
            testID={`nursing-duration-preset-${minutes}`}
            label={t("home.durationPreset", { minutes })}
            tone="nursing"
            onPress={() => handlePreset(minutes)}
            style={{ flexBasis: "47%" }}
          />
        ))}
      </View>
      <Button label={t("common.cancel")} tone="neutral" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}
