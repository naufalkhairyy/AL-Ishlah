export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d631b",
        "primary-container": "#2e7d32",
        background: "#f7fbf0",
        "on-background": "#181d17",
        "surface-container-low": "#f1f5eb",
        "outline-variant": "#bfcaba",
        "surface-bright": "#ffffff",
      },
      spacing: {
        "container-max": "1140px",
        "section-padding": "5rem",
        "stack-md": "1rem",
      },
      fontFamily: {
        h1: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}