import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { displayToMl, mlToDisplay } from "@/domain/units";
import { NursingSide } from "@/db/types";

const SIDES: NursingSide[] = ["left", "right", "both", "unknown"];

export default function EditEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const unit = useSettingsStore((s) => s.unit);

  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);
  const updateNursing = useLogStore((s) => s.updateNursing);
  const updatePump = useLogStore((s) => s.updatePump);
  const updateBottle = useLogStore((s) => s.updateBottle);
  const deleteNursing = useLogStore((s) => s.deleteNursing);
  const deletePump = useLogStore((s) => s.deletePump);
  const deleteBottle = useLogStore((s) => s.deleteBottle);

  const nursing = kind === "nursing" ? nursingSessions.find((s) => s.id === id) : undefined;
  const pump = kind === "pump" ? pumpEvents.find((p) => p.id === id) : undefined;
  const bottle = kind === "bottle" ? bottleEvents.find((b) => b.id === id) : undefined;

  const [mlText, setMlText] = useState(() => {
    if (pump) return pump.totalMl != null ? String(mlToDisplay(pump.totalMl, unit)) : "";
    if (bottle) return bottle.ml != null ? String(mlToDisplay(bottle.ml, unit)) : "";
    return "";
  });
  const [side, setSide] = useState<NursingSide>(nursing?.side ?? "unknown");

  const handleSave = () => {
    const parsed = mlText.trim().length > 0 ? Number(mlText) : null;
    const ml = parsed != null && !Number.isNaN(parsed) ? displayToMl(parsed, unit) : null;

    if (nursing) {
      updateNursing(nursing.id, { side });
    } else if (pump) {
      updatePump(pump.id, { leftMl: ml, rightMl: null });
    } else if (bottle) {
      updateBottle(bottle.id, { ml });
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(t("history.deleteConfirmTitle"), t("history.deleteConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          if (nursing) deleteNursing(nursing.id);
          else if (pump) deletePump(pump.id);
          else if (bottle) deleteBottle(bottle.id);
          router.back();
        },
      },
    ]);
  };

  const showMlField = Boolean(pump || bottle);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: theme.spacing.md }}>
      <Card style={{ gap: theme.spacing.sm }}>
        {nursing ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("home.whichSide")}</Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
              {SIDES.map((s) => (
                <Button
                  key={s}
                  label={t(`home.side${capitalize(s)}` as const, { defaultValue: s })}
                  tone="nursing"
                  variant={side === s ? "solid" : "outline"}
                  active={side === s}
                  onPress={() => setSide(s)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showMlField ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>
              {t("bottleEntry.amount")} ({unit})
            </Text>
            <TextInput
              testID="entry-edit-field-ml"
              value={mlText}
              onChangeText={setMlText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.md,
                padding: theme.spacing.sm,
                fontSize: 18,
                color: theme.colors.textPrimary,
              }}
            />
          </View>
        ) : null}

        <Button testID="entry-edit-save" label={t("common.save")} tone="accent" onPress={handleSave} />
        <Button label={t("history.deleteEntry")} tone="danger" variant="outline" onPress={handleDelete} />
      </Card>
    </ScrollView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
