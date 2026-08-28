import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { CrownMark } from "@/components/CrownMark";

interface NavItem {
  key: "home" | "history" | "settings";
  route: "/" | "/history" | "/settings";
  labelKey: string;
  testID: string;
}

const ITEMS: NavItem[] = [
  { key: "home", route: "/", labelKey: "nav.home", testID: "nav-home" },
  { key: "history", route: "/history", labelKey: "nav.history", testID: "nav-history" },
  { key: "settings", route: "/settings", labelKey: "nav.settings", testID: "nav-settings" },
];

/** Shared bottom navigation used by every top-level screen (Home/History/Settings). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>{children}</View>
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom || theme.spacing.sm,
          paddingTop: theme.spacing.xs,
        }}
      >
        {ITEMS.map((item) => {
          const active = pathname === item.route;
          return (
            <Pressable
              key={item.key}
              testID={item.testID}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.route)}
              style={{ flex: 1, alignItems: "center", paddingVertical: theme.spacing.xs, minHeight: 48 }}
            >
              {item.key === "home" ? (
                <CrownMark size={20} color={active ? theme.colors.accent : theme.colors.textMuted} />
              ) : null}
              <Text
                style={[
                  theme.type.caption,
                  { color: active ? theme.colors.accent : theme.colors.textMuted, marginTop: 2 },
                ]}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
