import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root") as HTMLElement);

// Theme + CssBaseline are owned entirely by App.tsx's own provider stack
// (LocalizationProvider -> ThemeProvider from contexts/ThemeContext.tsx),
// which builds the theme dynamically per dark/light mode and swaps in the
// RTL emotion cache for Hebrew. This file used to ALSO wrap everything in
// a second, static ThemeProvider + CssBaseline using the old ./theme.ts
// (no RTL support, no dark mode, different MuiOutlinedInput/MuiTextField
// overrides) — two competing global resets and theme objects layered on
// top of each other, which is the kind of thing that produces exactly the
// intermittent "label sliced by the input border" glitch reported on the
// Auth page. Removed; App.tsx's provider is the single source of truth now.
root.render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>
);
