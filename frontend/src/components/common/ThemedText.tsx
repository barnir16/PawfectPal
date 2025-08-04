import { Typography, useTheme } from "@mui/material";
import type { TypographyProps } from "@mui/material";

type ThemedTextProps = TypographyProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({ type = "default", sx, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const variantMapping: Record<
    string,
    Partial<TypographyProps & { sx?: any }>
  > = {
    default: { variant: "body1", fontWeight: "normal", lineHeight: 1.5 },
    defaultSemiBold: { variant: "body1", fontWeight: 600, lineHeight: 1.5 },
    title: { variant: "h4", fontWeight: "bold", lineHeight: 1.3 },
    subtitle: { variant: "h6", fontWeight: "bold", lineHeight: 1.2 },
    link: {
      variant: "body1",
      sx: {
        color: theme.palette.primary.main,
        textDecoration: "underline",
        cursor: "pointer",
        lineHeight: 1.8,
      },
    },
  };

  const styleProps = variantMapping[type] || variantMapping.default;

  return (
    <Typography {...styleProps} sx={{ ...styleProps.sx, ...sx }} {...rest} />
  );
}
