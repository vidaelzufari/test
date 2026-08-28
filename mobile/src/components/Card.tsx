import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  raised?: boolean;
  padded?: boolean;
}

export function Card({ children, style, raised = false, padded = true }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: raised ? theme.colors.surfaceRaised : theme.colors.surface,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing.md : 0,
        },
        raised ? theme.shadows.card : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}
