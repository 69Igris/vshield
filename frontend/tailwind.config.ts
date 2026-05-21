import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // True Void foundation
        void: "#030304",
        matter: "#0F1115",
        dim: "#1E293B",
        // Text
        stardust: "#94A3B8",
        // Bitcoin Fire palette
        btc: {
          primary: "#F7931A", // Bitcoin Orange
          secondary: "#EA580C", // Burnt Orange
          gold: "#FFD600", // Digital Gold
        },
        // Legacy alias — kept so any leftover `brand-*` classes keep working
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F7931A",
          600: "#EA580C",
          700: "#C2410C",
          900: "#7C2D12",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "btc-gradient": "linear-gradient(to right, #EA580C, #F7931A)",
        "btc-gradient-bright": "linear-gradient(to right, #F7931A, #FFD600)",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(234, 88, 12, 0.5)",
        "glow-lg": "0 0 30px -5px rgba(247, 147, 26, 0.6)",
        "glow-gold": "0 0 20px rgba(255, 214, 0, 0.3)",
        "glow-card": "0 0 50px -10px rgba(247, 147, 26, 0.1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
