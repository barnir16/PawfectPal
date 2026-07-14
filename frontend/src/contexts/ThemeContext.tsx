import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Warm palette used in both light and dark modes.
// Dark mode keeps the same amber/teal hues but flips backgrounds to warm charcoal.
const PALETTE = {
  primary:   { main: '#F4A261', light: '#F7BC8A', dark: '#E07B3A', contrastText: '#fff' },
  secondary: { main: '#2A9D8F', light: '#4FBFB2', dark: '#1D7A6E', contrastText: '#fff' },
  error:     { main: '#E76F51' },
  success:   { main: '#52B788', light: '#74C69D', dark: '#2D6A4F' },
  warning:   { main: '#E9C46A' },
  white:     { main: '#ffffff', contrastText: '#2D2D2D' },
};

function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...PALETTE,
      background: {
        default: mode === 'dark' ? '#1C1917' : '#FFFBF5',
        paper:   mode === 'dark' ? '#2A2522' : '#ffffff',
      },
      text: {
        primary:   mode === 'dark' ? '#F5EFE8' : '#2D2D2D',
        secondary: mode === 'dark' ? '#B5AAA0' : '#6B6B6B',
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: [
        '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
        '"Helvetica Neue"', 'Arial', 'sans-serif',
      ].join(','),
      h1: { fontSize: '2.5rem', fontWeight: 700 },
      h2: { fontSize: '2rem',   fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem',  fontWeight: 600 },
      h5: { fontSize: '1.25rem', fontWeight: 600 },
      h6: { fontSize: '1rem',    fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 24, fontWeight: 600 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 2px 12px rgba(0,0,0,0.4)'
              : '0 2px 12px rgba(0,0,0,0.06)',
            border: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(0,0,0,0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 16 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#F4A261',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f0e8df',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: mode === 'dark' ? '#2A2522' : '#FFF8F2',
              borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f0e8df',
            },
          },
        },
      },
    },
  });
}

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  setTheme: (mode: PaletteMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  // Read saved preference on first mount
  useEffect(() => {
    const saved = localStorage.getItem('pawfectPal_theme') as PaletteMode | null;
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('pawfectPal_theme', next);
  };

  const setTheme = (newMode: PaletteMode) => {
    setMode(newMode);
    localStorage.setItem('pawfectPal_theme', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <MuiThemeProvider theme={buildTheme(mode)}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export default ThemeProvider;
