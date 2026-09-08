import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        ink: "#000000",
        "on-primary": "#ffffff",
        "on-dark": "#ffffff",
        "canvas-night": "#000000",
        "canvas-night-elevated": "#0a0a0a",
        "surface-elevated-dark": "#1e2c31",
        "canvas-light": "#ffffff",
        "canvas-cream": "#fbfbf5",
        "hairline-light": "#e4e4e7",
        "hairline-dark": "#1e2c31",
        "aloe-10": "#c1fbd4",
        "pistachio-10": "#d4f9e0",
        "link-cool-1": "#9dabad",
        "link-cool-2": "#9797a2",
        "link-cool-3": "#bdbdca",
        "link-mint": "#99b3ad",
        shade: {
          30: "#d4d4d8",
          40: "#a1a1aa",
          50: "#71717a",
          60: "#52525b",
          70: "#3f3f46",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        pill: "9999px",
      },
      boxShadow: {
        // Shopify Level 1: Inset highlight for dark cards
        "cinematic-inset": "0 1px 2px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        // Shopify Level 2: Dark elevated cards
        "cinematic-elevated": "0 0 0 1px rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2)",
        // Shopify Level 3: Stacked paper halo shadows for transactional cards
        "paper-halo": "0 8px 8px rgba(0,0,0,0.06), 0 4px 4px rgba(0,0,0,0.04), 0 2px 2px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.06)",
        // Level 4: Modal / floating panel
        "floating-modal": "0 25px 50px -12px rgba(0,0,0,0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "NeueHaasGrotesk Display", "Helvetica Now Display", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
