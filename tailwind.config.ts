import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        surface: "#0a0a0a",
        surface2: "#111111",
        border: "rgba(255,255,255,0.06)",
        "border-strong": "rgba(255,255,255,0.10)",
        text: "#fafafa",
        "text-2": "rgba(250,250,250,0.60)",
        "text-3": "rgba(250,250,250,0.40)",
        "text-4": "rgba(250,250,250,0.25)",
        rival: "#737373",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        md: "6px",
      },
      fontFeatureSettings: {
        stylistic: '"ss01","cv11"',
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        pulse: "pulse 1.8s ease-in-out infinite",
        fadeIn: "fadeIn 180ms ease forwards",
        slideUp: "slideUp 260ms cubic-bezier(.2,.8,.2,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
