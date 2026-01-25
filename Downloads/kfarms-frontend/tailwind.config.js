/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // <-- PLACE IT RIGHT HERE
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out',
      },
      // -------------------------------------

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        accent: {
          primary: "#2563EB",
          subtle: "#C1B8FF",
          dark: "#3A35A5",
        },

        darkbg: "#0b0c10",
        darkCard: "#131620",
        darkPrimary: "#7F5AF0",
        darkSecondary: "#3B82F6",
        darkText: "#E5E7EB",
        darkMuted: "#9CA3AF",

        lightbg: "#F9FAFB",
        lightCard: "#FFFFFF",
        lightPrimary: "#7F5AF0",
        lightSecondary: "#3B82F6",
        lightText: "#111827",
        lightMuted: "#6B7280",

        status: {
          success: "#4ADE80",
          danger: "#d31818ff",
          warning: "#FBBF24",
          info: "#38BDF8",
        },
        backgroundImage: {
          "dark-gradient":
            "linear-gradient(135deg, #0d0f1a 0%, #1d2b64 50%, #090a14 100%)",
          "light-gradient":
            "linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #eef1f5 100%)",
        },
      },

      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.15)",
        dark: "0 4px 20px rgba(0,0,0,0.6)",
        neo: "0 4px 20px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.05)",
      },

      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },

      fontFamily: {
        header: ["Poppins", "Inter", "sans-serif"],
        body: ["Inter", "Roboto", "sans-serif"],
      },

      fontSize: {
        h1: ["2.5rem", { lineHeight: "3rem", fontWeight: "700" }],
        h2: ["2rem", { lineHeight: "2.5rem", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        base: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
