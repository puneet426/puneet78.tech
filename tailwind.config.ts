import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    // This covers both root-level and src-level directory configurations completely
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050101",
        foreground: "#fafafa",
        card: "#0d0d0d",
        muted: "#1b1b1b",
        "muted-foreground": "#8f8f8f",
        border: "#222222",
        ring: "#525252",
        lightBg: "#fdfbf7", 
        brand: {
          DEFAULT: "#9c93ff",
          fg: "#f8f8f8",
          subtle: "#181439",
          2: "#00b2f8"
        },
        good: "#00bb7f",
      },
      fontFamily: {
        display: ["var(--font-instrument-serif)", "Georgia", "serif"],
        displayXl: ["var(--font-anton)", "Arial Narrow", "sans-serif"],
        content: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "icon-pulse": {
          "0%, 100%": { opacity: "0", transform: "scale(0.3)" },
          "15%, 85%": { opacity: "0.5", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        }
      },
      animation: {
        "icon-pulse": "icon-pulse 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;