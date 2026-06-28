import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1b1b18",
        cream: "#f7f3ea",
        tomato: "#c84b31",
        olive: "#6b7048",
        brand: {
          primary: "var(--color-brand-primary)",
          secondary: "var(--color-brand-secondary)",
        },
        surface: {
          default: "var(--color-surface-default)",
          alt: "var(--color-surface-alt)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        status: {
          success: "var(--color-status-success)",
          warning: "var(--color-status-warning)",
          error: "var(--color-status-error)",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        button: "var(--radius-button)",
        card: "var(--radius-card)",
      },
      spacing: {
        section: "var(--section-spacing)",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(32, 28, 20, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
