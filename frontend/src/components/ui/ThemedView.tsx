import { Box, useTheme } from "@mui/material";
import type { BoxProps } from "@mui/material";

export type ThemedViewProps = BoxProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  lightColor,
  darkColor,
  sx,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();
  const mode = theme.palette.mode; // 'light' or 'dark'

  const backgroundColor =
    mode === "light"
      ? (lightColor ?? theme.palette.background.default)
      : (darkColor ?? theme.palette.background.default);

  return <Box sx={{ backgroundColor, ...sx }} {...otherProps} />;
}
