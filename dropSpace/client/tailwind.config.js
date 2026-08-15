/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0A14",
        surface: "#12121F",
        glass: "rgba(255,255,255,0.05)",
        "glass-border": "rgba(255,255,255,0.09)",
        violet: {
          DEFAULT: "#8B5CF6",
          soft: "#A78BFA",
        },
        magenta: {
          DEFAULT: "#EC4899",
          soft: "#F472B6",
        },
        cyan: {
          DEFAULT: "#22D3EE",
          soft: "#67E8F9",
        },
        amber: "#FBBF24",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "beam-gradient": "linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #22D3EE 100%)",
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.25), transparent 60%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        glow: "0 0 24px rgba(139,92,246,0.35)",
      },
      keyframes: {
        "beam-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scaleX(0.6)" },
          "50%": { opacity: "1", transform: "scaleX(1)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dot-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.5)" },
          "50%": { boxShadow: "0 0 0 6px rgba(34,211,238,0)" },
        },
      },
      animation: {
        "beam-pulse": "beam-pulse 2.4s ease-in-out infinite",
        "slide-in-left": "slide-in-left 0.35s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1)",
        "toast-in": "toast-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        "dot-pulse": "dot-pulse 2s infinite",
      },
    },
  },
  plugins: [],
};
