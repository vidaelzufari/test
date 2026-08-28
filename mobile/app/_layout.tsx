import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider, useTranslation } from "react-i18next";
import { getDatabase } from "@/db/client";
import i18n, { initI18n } from "@/i18n";
import { initSentry } from "@/services/sentry";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useBabyStore } from "@/store/useBabyStore";
import { useLogStore } from "@/store/useLogStore";
import { useStashStore } from "@/store/useStashStore";
import { useEntitlementStore } from "@/store/useEntitlementStore";
import { useSettingsStore } from "@/store/useSettingsStore";

initSentry();

function Bootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const refreshBabies = useBabyStore((s) => s.refresh);
  const activeBaby = useBabyStore((s) => s.activeBaby);
  const babies = useBabyStore((s) => s.babies);
  const refreshLog = useLogStore((s) => s.refresh);
  const refreshStash = useStashStore((s) => s.refresh);
  const initEntitlement = useEntitlementStore((s) => s.init);

  useEffect(() => {
    getDatabase(); // opens + migrates synchronously on first access
    initI18n(language === "system" ? undefined : language);
    refreshBabies();
    void initEntitlement();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    initI18n(language === "system" ? undefined : language);
  }, [language, ready]);

  useEffect(() => {
    const baby = activeBaby();
    if (ready && baby) {
      refreshLog(baby.id);
      refreshStash(baby.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, babies]);

  if (!ready) return null;
  return <>{children}</>;
}

function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.mode === "light" ? "dark" : "light"} />;
}

export default function RootLayout() {
  const { t } = useTranslation();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <Bootstrap>
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="history/index" />
                <Stack.Screen name="entry/[kind]/[id]" options={{ presentation: "modal", headerShown: true, title: t("history.editEntry") }} />
                <Stack.Screen name="profile/index" />
                <Stack.Screen name="profile/edit" options={{ presentation: "modal", headerShown: true }} />
                <Stack.Screen name="settings/index" />
                <Stack.Screen name="modals/pump-details" options={{ presentation: "modal", headerShown: false }} />
                <Stack.Screen name="modals/bottle-entry" options={{ presentation: "modal", headerShown: false }} />
                <Stack.Screen name="modals/nursing-duration" options={{ presentation: "modal", headerShown: false }} />
                <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false }} />
              </Stack>
            </Bootstrap>
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
