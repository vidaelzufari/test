import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { displayToMl } from "@/domain/units";
import { MilkType } from "@/db/types";

export default function BottleEntryModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.unit);
  const logBottle = useLogStore((s) => s.logBottle);

  const [amountText, setAmountText] = useState("");
  const [milkType, setMilkType] = useState<MilkType>("breast_milk");

  const commit = (withAmount: boolean) => {
    const ml = withAmount && amountText.trim() ? displayToMl(Number(amountText), unit) : null;
    logBottle(ml, milkType);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: "center", gap: theme.spacing.md }}>
      <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("bottleEntry.title")}</Text>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("bottleEntry.amount")} ({unit})</Text>
        <TextInput
          testID="bottle-entry-amount-input"
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            padding: theme.spacing.sm,
            fontSize: 28,
            textAlign: "center",
            color: theme.colors.textPrimary,
          }}
        />
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("bottleEntry.milkType")}</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Button
            testID="bottle-entry-type-breast-milk"
            label={t("bottleEntry.milkTypeBreastMilk")}
            tone="bottle"
            variant={milkType === "breast_milk" ? "solid" : "outline"}
            active={milkType === "breast_milk"}
            onPress={() => setMilkType("breast_milk")}
            style={{ flex: 1 }}
          />
          <Button
            testID="bottle-entry-type-formula"
            label={t("bottleEntry.milkTypeFormula")}
            tone="bottle"
            variant={milkType === "formula" ? "solid" : "outline"}
            active={milkType === "formula"}
            onPress={() => setMilkType("formula")}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <Button testID="bottle-entry-save" label={t("bottleEntry.save")} tone="bottle" onPress={() => commit(true)} />
      <Button label={t("bottleEntry.skipAmount")} tone="neutral" variant="ghost" onPress={() => commit(false)} />
    </View>
  );
}
