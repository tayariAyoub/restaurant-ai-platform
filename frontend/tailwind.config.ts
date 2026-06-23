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
      },
      boxShadow: {
        soft: "0 20px 60px rgba(32, 28, 20, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;

