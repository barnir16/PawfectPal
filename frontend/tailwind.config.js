/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          contrastText: '#fff',
        },
        secondary: {
          main: '#9c27b0',
          light: '#ba68c8',
          dark: '#7b1fa2',
          contrastText: '#fff',
        },
        error: {
          main: '#d32f2f',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
      },
      spacing: 4,
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable default styles to avoid conflicts with MUI
  },
}
