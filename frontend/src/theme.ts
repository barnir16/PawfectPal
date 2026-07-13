import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    white: Palette["primary"];
  }
  interface PaletteOptions {
    white?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    white: true;
  }
}

export const theme = createTheme({
  palette: {
    // Warm amber as primary — inviting, energetic, pet-friendly
    primary: {
      main: "#F4A261",
      light: "#F7BC8A",
      dark: "#E07B3A",
      contrastText: "#fff",
    },
    // Deep teal as secondary — trustworthy, calm, professional
    secondary: {
      main: "#2A9D8F",
      light: "#4FBFB2",
      dark: "#1D7A6E",
      contrastText: "#fff",
    },
    error: {
      main: "#E76F51", // warm coral instead of cold red
    },
    success: {
      main: "#52B788", // sage green
      light: "#74C69D",
      dark: "#2D6A4F",
    },
    warning: {
      main: "#E9C46A", // warm yellow
    },
    background: {
      default: "#FFFBF5", // warm off-white — not cold gray
      paper: "#ffffff",
    },
    text: {
      primary: "#2D2D2D",
      secondary: "#6B6B6B",
    },
    white: {
      main: "#ffffff",
      contrastText: "#000000",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-