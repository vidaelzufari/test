import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { displayToMl, formatVolume } from "@/domain/units";

/**
 * Shown right after "Pumped" already saved instantly. Everything here is
 * optional — dismissing leaves a "needs detail" badge in History instead of
 * blocking the save that already happened.
 */
export default function PumpDetailsModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.unit);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const addPumpDetail = useLogStore((s) => s.addPumpDetail);

  const latest = pumpEvents[0];
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");

  const leftMl = leftText.trim() ? displayToMl(Number(leftText), unit) : 0;
  const rightMl = rightText.trim() ? displayToMl(Number(rightText), unit) : 0;
  const totalMl = leftMl + rightMl;

  const handleSave = () => {
    if (latest) addPumpDetail(latest.id, leftMl || null, rightMl || null);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: "center", gap: theme.spacing.md }}>
      <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("pumpDetail.title")}</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("pumpDetail.subtitle")}</Text>

      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("pumpDetail.leftMl", { unit })}</Text>
          <TextInput
            testID="pump-detail-left-input"
            value={leftText}
            onChangeText={setLeftText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle(theme)}
          />
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("pumpDetail.rightMl", { unit })}</Text>
          <TextInput
            testID="pump-detail-right-input"
            value={rightText}
            onChangeText={setRightText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle(theme)}
          />
        </View>
      </View>

      <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>
        {t("pumpDetail.total", { amount: formatVolume(totalMl, unit) })}
      </Text>

      <Button testID="pump-detail-save" label={t("pumpDetail.save")} tone="pumping" onPress={handleSave} />
      <Button testID="pump-detail-dismiss" label={t("pumpDetail.dismiss")} tone="neutral" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>) {
  return {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    fontSize: 20,
    color: theme.colors.textPrimary,
  } as const;
}
