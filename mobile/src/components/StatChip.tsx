import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export interface StatChipProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
}

/** Compact stat used in the home screen's live status strip. */
export function StatChip({ label, value, icon, tone = "neutral" }: StatChipProps) {
  const theme = useTheme();
  const toneColor =
    tone === "warning" ? theme.colors.warning : tone === "success" ? theme.colors.success : theme.colors.textPrimary;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: theme.spacing.xs,
        gap: 2,
      }}
    >
      {icon}
      <Text style={[theme.type.bodyStrong, { color: toneColor }]} maxFontSizeMultiplier={1.6}>
        {value}
      </Text>
      <Text
        style={[theme.type.micro, { color: theme.colors.textMuted, textTransform: "uppercase" }]}
        maxFontSizeMultiplier={1.6}
      >
        {label}
      </Text>
    </View>
  );
}
