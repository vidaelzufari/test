import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card, CrownMark } from "@/components";
import { useBabyStore } from "@/store/useBabyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeAge } from "@/domain/dateMath";
import { weightRepository } from "@/db/repositories";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const babies = useBabyStore((s) => s.babies);
  const activeBaby = useBabyStore((s) => s.activeBaby)();
  const switchActiveBaby = useBabyStore((s) => s.switchActiveBaby);
  const activeBabyId = useSettingsStore((s) => s.activeBabyId);

  const now = new Date();
  const age = activeBaby ? computeAge(new Date(activeBaby.dateOfBirth), now) : null;
  const weightEntries = activeBaby ? weightRepository.listByBaby(activeBaby.id) : [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md }}>
      <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("profile.title")}</Text>

      {activeBaby ? (
        <Card style={{ alignItems: "center", gap: theme.spacing.sm }}>
          {activeBaby.photoUri ? (
            <Image source={{ uri: activeBaby.photoUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: theme.colors.surfaceRaised,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrownMark size={36} />
            </View>
          )}
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{activeBaby.name}</Text>
          {age ? (
            <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>
              {age.isMonthsPhase ? t("profile.age.months", { count: age.months }) : t("profile.age.weeks", { count: age.weeks })}
            </Text>
          ) : null}
          <Text style={[theme.type.micro, { color: theme.colors.textMuted }]}>{t("profile.privacyNote")}</Text>
          <Button label={t("common.edit")} tone="neutral" variant="outline" onPress={() => router.push(`/profile/edit?id=${activeBaby.id}`)} />
        </Card>
      ) : null}

      <Card style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.weight")}</Text>
        {weightEntries.length === 0 ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{t("profile.weightEmpty")}</Text>
        ) : (
          weightEntries
            .slice()
            .reverse()
            .map((entry) => (
              <Text key={entry.id} style={[theme.type.body, { color: theme.colors.textSecondary }]}>
                {(entry.weightGrams / 1000).toFixed(2)} kg — {new Date(entry.measuredAt).toLocaleDateString()}
              </Text>
            ))
        )}
      </Card>

      {babies.length > 1 ? (
        <Card style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.switchBaby")}</Text>
          {babies.map((baby) => (
            <Button
              key={baby.id}
              label={baby.name}
              tone="accent"
              variant={baby.id === activeBabyId ? "solid" : "outline"}
              active={baby.id === activeBabyId}
              onPress={() => switchActiveBaby(baby.id)}
            />
          ))}
        </Card>
      ) : null}

      <Button label={t("profile.addBaby")} tone="accent" variant="outline" onPress={() => router.push("/profile/edit")} />
    </ScrollView>
  );
}
