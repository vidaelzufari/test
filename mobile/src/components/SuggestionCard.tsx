import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "./Card";

export interface SuggestionCardProps {
  title: string;
  body: string;
  footnote: string;
  icon?: React.ReactNode;
  onDismiss: () => void;
  dismissLabel: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * "Queen's advisor" card — always gentle, always dismissible, never an
 * alarm. Every card must carry the medical-advice footnote.
 */
export function SuggestionCard({
  title,
  body,
  footnote,
  icon,
  onDismiss,
  dismissLabel,
  actionLabel,
  onAction,
}: SuggestionCardProps) {
  const theme = useTheme();
  return (
    <Card raised style={{ borderColor: theme.colors.crown, borderWidth: 1 }}>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {icon}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{body}</Text>
          <Text style={[theme.type.micro, { color: theme.colors.textMuted, marginTop: 4 }]}>
            {footnote}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.xs }}>
            {actionLabel && onAction ? (
              <Pressable onPress={onAction} accessibilityRole="button">
                <Text style={[theme.type.caption, { color: theme.colors.accent, fontWeight: "700" }]}>
                  {actionLabel}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onDismiss} accessibilityRole="button">
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{dismissLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
}
