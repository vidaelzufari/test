import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { EntryRow, EntryKind } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatVolume } from "@/domain/units";
import { formatDurationShort } from "@/domain/dateMath";

interface HistoryRow {
  id: string;
  kind: EntryKind;
  at: Date;
  title: string;
  detailLabel?: string;
  needsDetail: boolean;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.unit);

  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);

  const rows = useMemo<HistoryRow[]>(() => {
    const nursingRows: HistoryRow[] = nursingSessions.map((s) => ({
      id: s.id,
      kind: "nursing",
      at: new Date(s.startedAt),
      title: s.side === "unknown" ? t("history.nursingTitle") : t("history.nursingTitleWithSide", { side: s.side }),
      detailLabel: s.durationSeconds != null ? formatDurationShort(Math.round(s.durationSeconds / 60)) : undefined,
      needsDetail: false,
    }));
    const pumpRows: HistoryRow[] = pumpEvents.map((p) => ({
      id: p.id,
      kind: "pump",
      at: new Date(p.startedAt),
      title: t("history.pumpTitle"),
      detailLabel: p.totalMl != null ? formatVolume(p.totalMl, unit) : undefined,
      needsDetail: p.needsDetail,
    }));
    const bottleRows: HistoryRow[] = bottleEvents.map((b) => ({
      id: b.id,
      kind: "bottle",
      at: new Date(b.occurredAt),
      title: b.milkType === "breast_milk" ? t("history.bottleTitleBreastMilk") : t("history.bottleTitleFormula"),
      detailLabel: b.ml != null ? formatVolume(b.ml, unit) : undefined,
      needsDetail: b.ml == null,
    }));
    return [...nursingRows, ...pumpRows, ...bottleRows].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [nursingSessions, pumpEvents, bottleEvents, unit, t]);

  return (
    <AppShell>
      <View style={{ padding: theme.spacing.md, paddingBottom: 0 }}>
        <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("history.title")}</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={
          <Text style={[theme.type.body, { color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.xl }]}>
            {t("history.empty")}
          </Text>
        }
        renderItem={({ item, index }) => (
          <EntryRow
            kind={item.kind}
            title={item.title}
            timeLabel={format(item.at, "PPp")}
            detailLabel={item.detailLabel}
            needsDetail={item.needsDetail}
            needsDetailLabel={t("history.needsMl")}
            onPress={() => router.push(`/entry/${item.kind}/${item.id}`)}
            testID={index === 0 ? "history-entry-row-0" : `history-entry-row-${index}`}
          />
        )}
      />
    </AppShell>
  );
}
