// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#1976d2", // ← enables ring-primary-500
          400: "#42a5f5",
          600: "#1565c0",
          contrastText: "#fff",
        },
        secondary: {
          500: "#9c27b0",
          400: "#ba68c8",
          600: "#7b1fa2",
          contrastText: "#fff",
        },
        error: {
          500: "#d32f2f",
        },
        background: {
          default: "#f5f5f5",
          paper: "#ffffff",
        },
      },
      spacing: {
        4: "1rem", // optional: this already exists in Tailwind by default
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
