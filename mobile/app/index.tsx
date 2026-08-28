import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card, CrownMark, StatChip, SuggestionCard } from "@/components";
import { useBabyStore } from "@/store/useBabyStore";
import { useLogStore, computeStatusStrip } from "@/store/useLogStore";
import { useStashStore } from "@/store/useStashStore";
import { useEntitlementStore } from "@/store/useEntitlementStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeAge, formatDurationShort, minutesSince, weeksSinceBirth } from "@/domain/dateMath";
import { computeNextFeedWindow, computeStashForecast, suggestPumpSlots } from "@/domain/recommendations";
import { formatVolume } from "@/domain/units";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const [dismissedFeedSuggestion, setDismissedFeedSuggestion] = useState(false);
  const [dismissedPumpSuggestion, setDismissedPumpSuggestion] = useState(false);

  const activeBaby = useBabyStore((s) => s.activeBaby)();
  const unit = useSettingsStore((s) => s.unit);
  const returnToWorkDate = useSettingsStore((s) => s.returnToWorkDate);
  const targetStashMl = useSettingsStore((s) => s.targetStashMl);
  const isUnlocked = useEntitlementStore((s) => s.isUnlocked);

  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);
  const openNursingSession = useLogStore((s) => s.openNursingSession)();
  const startNursing = useLogStore((s) => s.startNursing);
  const stopNursing = useLogStore((s) => s.stopNursing);
  const logPump = useLogStore((s) => s.logPump);

  const stashItems = useStashStore((s) => s.items);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const statusStrip = useMemo(
    () => computeStatusStrip(nursingSessions, pumpEvents, bottleEvents, now),
    [nursingSessions, pumpEvents, bottleEvents, now]
  );

  const ageWeeks = activeBaby ? weeksSinceBirth(new Date(activeBaby.dateOfBirth), now) : 0;
  const age = activeBaby ? computeAge(new Date(activeBaby.dateOfBirth), now) : null;

  const feedWindow = useMemo(() => {
    const times = nursingSessions.slice(0, 8).map((s) => new Date(s.startedAt));
    return computeNextFeedWindow(times, ageWeeks, now);
  }, [nursingSessions, ageWeeks, now]);

  const stashForecast = useMemo(() => {
    const totalTodayMl = statusStrip.todayBottleMl;
    return computeStashForecast(stashItems, now, totalTodayMl > 0 ? totalTodayMl : null);
  }, [stashItems, now, statusStrip.todayBottleMl]);

  const pumpSuggestions = useMemo(
    () =>
      suggestPumpSlots({
        nursingStartTimes: nursingSessions.slice(0, 20).map((s) => new Date(s.startedAt)),
        pumpHistory: pumpEvents
          .filter((p) => p.totalMl != null)
          .map((p) => ({ at: new Date(p.startedAt), totalMl: p.totalMl as number })),
        now,
        returnToWorkDate: returnToWorkDate ? new Date(returnToWorkDate) : null,
        targetStashMl,
        currentStashMl: stashForecast.totalMl,
      }),
    [nursingSessions, pumpEvents, now, returnToWorkDate, targetStashMl, stashForecast.totalMl]
  );

  const handleStart = () => startNursing();
  const handleStop = () => {
    if (openNursingSession) {
      stopNursing();
    } else {
      router.push("/modals/nursing-duration");
    }
  };
  const handlePump = () => {
    logPump();
    router.push("/modals/pump-details");
  };
  const handleBottle = () => router.push("/modals/bottle-entry");

  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
          <CrownMark size={22} />
          <Text style={[theme.type.title, { color: theme.colors.textPrimary, marginStart: theme.spacing.xs, flex: 1 }]}>
            {t("common.appName")}
          </Text>
          <Button
            label={activeBaby?.name.charAt(0).toUpperCase() ?? "+"}
            tone="neutral"
            haptic="light"
            onPress={() => router.push("/profile")}
            style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 0, borderRadius: 999 }}
            testID="home-avatar-button"
          />
        </View>

        {!activeBaby ? (
          <Card raised style={{ alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <CrownMark size={32} />
            <Text style={[theme.type.body, { color: theme.colors.textSecondary, textAlign: "center" }]}>
              {t("profile.addBaby")}
            </Text>
            <Button label={t("profile.addBaby")} tone="accent" onPress={() => router.push("/profile/edit")} testID="home-add-baby-cta" />
          </Card>
        ) : null}

        {activeBaby ? (
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.md }]}>
            {activeBaby.name} · {age && (age.isMonthsPhase ? t("profile.age.months", { count: age.months }) : t("profile.age.weeks", { count: age.weeks }))}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <Button
            testID="home-button-start-nursing"
            label={openNursingSession ? t("home.nursingActive") : t("home.startedNursing")}
            subLabel={openNursingSession ? formatDurationShort(minutesSince(new Date(openNursingSession.startedAt), now)) : undefined}
            tone="nursing"
            active={Boolean(openNursingSession)}
            large
            fullWidth
            haptic="success"
            onPress={handleStart}
            disabled={Boolean(openNursingSession)}
            style={{ flex: 1 }}
          />
          <Button
            testID="home-button-stop-nursing"
            label={t("home.stoppedNursing")}
            tone="nursing"
            variant="outline"
            large
            fullWidth
            haptic="success"
            onPress={handleStop}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Button
            testID="home-button-pump"
            label={t("home.pumped")}
            tone="pumping"
            large
            fullWidth
            haptic="success"
            onPress={handlePump}
            style={{ flex: 1 }}
          />
          <Button
            testID="home-button-bottle"
            label={t("home.bottle")}
            tone="bottle"
            large
            fullWidth
            haptic="success"
            onPress={handleBottle}
            style={{ flex: 1 }}
          />
        </View>

        <Card style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: "row" }}>
            <StatChip
              label={t("statusStrip.lastFeed")}
              value={statusStrip.lastFeedAt ? formatDurationShort(minutesSince(statusStrip.lastFeedAt, now)) : t("statusStrip.lastFeedNever")}
            />
            <StatChip label={t("statusStrip.lastSide")} value={statusStrip.lastNursingSide ?? t("statusStrip.sideUnknown")} />
            <StatChip label={t("statusStrip.todayFeeds")} value={String(statusStrip.todayNursingCount)} />
            <StatChip label={t("statusStrip.currentStash")} value={formatVolume(stashForecast.totalMl, unit)} />
          </View>
        </Card>

        {isUnlocked ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("recommendations.title")}</Text>
            {!dismissedFeedSuggestion && activeBaby ? (
              <SuggestionCard
                title={feedWindow.hasOwnData ? t("recommendations.nextFeed.titleWithName", { name: activeBaby.name }) : t("recommendations.nextFeed.titleGeneric")}
                body={
                  feedWindow.hasOwnData
                    ? t("recommendations.nextFeed.body", { earliest: format(feedWindow.earliestAt, "p"), latest: format(feedWindow.latestAt, "p") })
                    : t("recommendations.nextFeed.bodyNoData", { name: activeBaby.name })
                }
                footnote={t("recommendations.disclaimer")}
                onDismiss={() => setDismissedFeedSuggestion(true)}
                dismissLabel={t("common.skip")}
              />
            ) : null}
            {!dismissedPumpSuggestion && pumpSuggestions.slots.length > 0 ? (
              <SuggestionCard
                title={
                  pumpSuggestions.slots[0]!.reason === "morning-surplus"
                    ? t("recommendations.pumpSuggestion.titleMorning")
                    : pumpSuggestions.slots[0]!.reason === "stash-goal"
                      ? t("recommendations.pumpSuggestion.titleStashGoal")
                      : t("recommendations.pumpSuggestion.titleGap")
                }
                body={
                  pumpSuggestions.slots[0]!.reason === "morning-surplus"
                    ? t("recommendations.pumpSuggestion.bodyMorning", { time: format(pumpSuggestions.slots[0]!.suggestedAt, "p") })
                    : t("recommendations.pumpSuggestion.bodyGap", { time: format(pumpSuggestions.slots[0]!.suggestedAt, "p") })
                }
                footnote={t("recommendations.disclaimer")}
                onDismiss={() => setDismissedPumpSuggestion(true)}
                dismissLabel={t("common.skip")}
              />
            ) : null}
          </View>
        ) : (
          <Card raised style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <Text style={[theme.type.body, { color: theme.colors.textSecondary, textAlign: "center" }]}>
              {t("recommendations.unlockPrompt")}
            </Text>
            <Button label={t("recommendations.unlockCta")} tone="accent" onPress={() => router.push("/paywall")} />
          </Card>
        )}
      </ScrollView>
    </AppShell>
  );
}
