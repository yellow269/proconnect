import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef9ff", 100: "#d9f1ff", 500: "#0b8ce9", 600: "#0070c9", 700: "#0059a3", 950: "#06263f" },
      },
      boxShadow: { soft: "0 20px 60px -20px rgb(15 23 42 / 0.18)" },
    },
  },
  plugins: [],
} satisfies Config;
