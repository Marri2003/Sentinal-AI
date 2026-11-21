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
        border: "hsl(var(--border, 30 20% 88%))",
        input: "hsl(var(--input, 30 20% 88%))",
        ring: "hsl(var(--ring, 24 95% 53%))",
        background: "hsl(var(--background, 40 33% 98%))",
        foreground: "hsl(var(--foreground, 222 47% 11%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 24 95% 53%))",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 35 25% 92%))",
          foreground: "hsl(var(--secondary-foreground, 222 47% 11%))",
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
          DEFAULT: "hsl(var(--muted, 35 25% 95%))",
          foreground: "hsl(var(--muted-foreground, 215 16% 47%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 35 30% 90%))",
          foreground: "hsl(var(--accent-foreground, 222 47% 11%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222 47% 11%))",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [],
}
