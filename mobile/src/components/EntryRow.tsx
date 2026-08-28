import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "./Card";

export type EntryKind = "nursing" | "pump" | "bottle";

export interface EntryRowProps {
  kind: EntryKind;
  title: string;
  timeLabel: string;
  detailLabel?: string;
  needsDetail?: boolean;
  needsDetailLabel?: string;
  onPress: () => void;
  testID?: string;
}

/** One row in History. Editing an entry is always this one tap away. */
export function EntryRow({
  kind,
  title,
  timeLabel,
  detailLabel,
  needsDetail = false,
  needsDetailLabel,
  onPress,
  testID,
}: EntryRowProps) {
  const theme = useTheme();
  const dotColor =
    kind === "nursing" ? theme.colors.nursing : kind === "pump" ? theme.colors.pumping : theme.colors.bottle;

  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button">
      <Card style={{ marginBottom: theme.spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: dotColor,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{timeLabel}</Text>
          </View>
          {detailLabel ? (
            <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{detailLabel}</Text>
          ) : null}
          {needsDetail ? (
            <View
              testID="history-needs-detail-badge"
              style={{
                backgroundColor: theme.colors.warning,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.xs,
                paddingVertical: 2,
              }}
            >
              <Text style={[theme.type.micro, { color: theme.colors.accentContrast }]}>
                {needsDetailLabel ?? "+ add ml"}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
