/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#070b14",
          card: "#0d1527",
          cardHover: "#131f38",
          border: "#1e293b",
          borderHover: "#334155",
          borderGlow: "rgba(56, 189, 248, 0.2)",
          blue: "#38bdf8",
          primary: "#2563eb",
          danger: "#ef4444",
          warning: "#f59e0b",
          success: "#10b981",
          muted: "#94a3b8",
          text: "#f8fafc",
        },
        border: "hsl(var(--border, 222 47% 16%))",
        input: "hsl(var(--input, 222 47% 16%))",
        ring: "hsl(var(--ring, 199 89% 48%))",
        background: "hsl(var(--background, 222 47% 5%))",
        foreground: "hsl(var(--foreground, 210 40% 98%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 199 89% 48%))",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 217 33% 17%))",
          foreground: "hsl(var(--secondary-foreground, 210 40% 98%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84% 60%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
        },
        success: {
          DEFAULT: "hsl(var(--success, 142 71% 45%))",
          foreground: "hsl(var(--success-foreground, 0 0% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 217 33% 17%))",
          foreground: "hsl(var(--muted-foreground, 215 20% 65%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 217 33% 20%))",
          foreground: "hsl(var(--accent-foreground, 210 40% 98%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 222 47% 9%))",
          foreground: "hsl(var(--card-foreground, 210 40% 98%))",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(56, 189, 248, 0.25)",
        "glow-red": "0 0 20px -5px rgba(239, 68, 68, 0.25)",
        "glow-green": "0 0 20px -5px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
}
