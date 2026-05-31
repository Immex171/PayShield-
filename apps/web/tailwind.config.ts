import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#020408",
        base: "#060d14",
        surface: "#0a1520",
        elevated: "#0f1e2e",
        overlay: "#14283c",
        cyan: {
          DEFAULT: "#00d4ff",
          dim: "rgba(0,212,255,0.15)",
          glow: "rgba(0,212,255,0.35)",
        },
        mint: {
          DEFAULT: "#00ffcc",
          dim: "rgba(0,255,204,0.12)",
        },
        teal: "#00b4cc",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderColor: {
        subtle: "rgba(0,212,255,0.08)",
        default: "rgba(0,212,255,0.16)",
        strong: "rgba(0,212,255,0.3)",
      },
      backgroundImage: {
        "grid-cyan":
          "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
        "gradient-brand":
          "linear-gradient(135deg, #00d4ff 0%, #00ffcc 100%)",
        "gradient-surface":
          "linear-gradient(180deg, #0a1520 0%, #060d14 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease forwards",
        "float-glow": "floatGlow 6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "scan-line": "scanLine 8s linear infinite",
        "encrypted-pulse": "encryptedPulse 2.5s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 40px rgba(0,212,255,0.12)",
        card: "0 4px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(0,212,255,0.08) inset",
        "glow-lg": "0 0 60px rgba(0,212,255,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
