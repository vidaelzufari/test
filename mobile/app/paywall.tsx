import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, CrownMark } from "@/components";
import { useEntitlementStore } from "@/store/useEntitlementStore";

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const purchase = useEntitlementStore((s) => s.purchase);
  const restore = useEntitlementStore((s) => s.restore);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: "center", gap: theme.spacing.md, alignItems: "center" }}>
      <CrownMark size={48} />
      <Text style={[theme.type.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>{t("paywall.title")}</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, textAlign: "center" }]}>{t("paywall.subtitle")}</Text>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{t("paywall.priceNote")}</Text>
      <Button label={t("paywall.purchase")} tone="accent" fullWidth onPress={() => purchase().then(() => router.back())} />
      <Button label={t("paywall.restore")} tone="neutral" variant="outline" fullWidth onPress={() => void restore()} />
      <Button label={t("paywall.notNow")} tone="neutral" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}
