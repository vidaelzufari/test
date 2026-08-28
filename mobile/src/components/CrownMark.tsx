import React from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";

/** Minimal geometric crown mark — the app's identity motif, used sparingly. */
export function CrownMark({ size = 24, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  const fill = color ?? theme.colors.crown;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8.5L7 11L12 4L17 11L21 8.5V17C21 17.5523 20.5523 18 20 18H4C3.44772 18 3 17.5523 3 17V8.5Z"
        fill={fill}
      />
      <Path d="M4 19.5H20" stroke={fill} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
