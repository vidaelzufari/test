import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

export type ButtonTone = "accent" | "nursing" | "pumping" | "bottle" | "neutral" | "danger";
export type ButtonVariant = "solid" | "outline" | "ghost";

export interface ButtonProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  active?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  large?: boolean;
  haptic?: "light" | "medium" | "success" | "none";
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Core tappable primitive. Every big logger action uses this so scale +
 * haptic feedback (a tap "feels" confirmed without needing to look) is
 * consistent everywhere.
 */
export function Button({
  label,
  subLabel,
  icon,
  tone = "accent",
  variant = "solid",
  active = false,
  disabled = false,
  fullWidth = false,
  large = false,
  haptic = "light",
  onPress,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toneColor = toneToColor(tone, theme.colors);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (haptic === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (haptic === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPress();
  }, [disabled, haptic, onPress]);

  const backgroundColor =
    variant === "solid" ? (active ? toneColor.active : toneColor.base) : "transparent";
  const borderColor = variant === "outline" ? toneColor.base : "transparent";
  const textColor =
    variant === "solid" ? toneColor.contrast : disabled ? theme.colors.textMuted : toneColor.base;

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "outline" ? 2 : 0,
          minHeight: large ? MIN_TOUCH_TARGET * 1.4 : MIN_TOUCH_TARGET,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.5 : 1,
          borderRadius: theme.radii.lg,
          paddingHorizontal: theme.spacing.lg,
        },
        theme.shadows.card,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <View>
          <Text
            style={[
              theme.type.subtitle,
              { color: textColor, textAlign: "center" },
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.6}
          >
            {label}
          </Text>
          {subLabel ? (
            <Text
              style={[
                theme.type.caption,
                { color: textColor, opacity: 0.85, textAlign: "center" },
              ]}
              maxFontSizeMultiplier={1.6}
            >
              {subLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

function toneToColor(
  tone: ButtonTone,
  colors: ReturnType<typeof useTheme>["colors"]
): { base: string; active: string; contrast: string } {
  switch (tone) {
    case "nursing":
      return { base: colors.nursing, active: colors.danger, contrast: colors.accentContrast };
    case "pumping":
      return { base: colors.pumping, active: colors.accent, contrast: colors.accentContrast };
    case "bottle":
      return { base: colors.bottle, active: colors.success, contrast: colors.accentContrast };
    case "neutral":
      return { base: colors.surfaceRaised, active: colors.border, contrast: colors.textPrimary };
    case "danger":
      return { base: colors.danger, active: colors.danger, contrast: colors.accentContrast };
    case "accent":
    default:
      return { base: colors.accent, active: colors.crown, contrast: colors.accentContrast };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
