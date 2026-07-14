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
    primary: {
      main: "#F4A261",
      light: "#F7BC8A",
      dark: "#E07B3A",
      contrastText: "#fff",
    },
    secondary: {
      main: "#2A9D8F",
      light: "#4FBFB2",
      dark: "#1D7A6E",
      contrastText: "#fff",
    },
    error: {
      main: "#E76F51",
    },
    success: {
      main: "#52B788",
      light: "#74C69D",
      dark: "#2D6A4F",
    },
    warning: {
      main: "#E9C46A",
    },
    background: {
      default: "#FFFBF5",
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
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.1rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 50,
          fontWeight: 600,
          paddingLeft: 20,
          paddingRight: 20,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 12px rgba(244, 162, 97, 0.35)",
          },
        },
        sizeSmall: {
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 50,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          border: "1px solid rgba(0,0,0,0.05)",
          transition: "box-shadow 0.2s ease, transform 0.15s ease",
          "&:hover": {
            boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
        elevation1: {
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "1px 8px",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0,0,0,0.07)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.8rem",
        },
      },
    },
  },
});
