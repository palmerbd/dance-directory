import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0c1428",
          50:  "#f0f3f9",
          100: "#d9e0ef",
          200: "#b3c1df",
          300: "#7a93c5",
          400: "#4a6aaa",
          500: "#2d4f8e",
          600: "#1e3a8a",
          700: "#1a2d5a",
          800: "#142140",
          900: "#0c1428",
        },
        gold: {
          DEFAULT: "#b8922a",
          50:  "#fdf4e3",
          100: "#f9e4b4",
          200: "#f0d080",
          300: "#e8c560",
          400: "#d4a840",
          500: "#b8922a",
          600: "#9a7620",
          700: "#7a5c18",
          800: "#5c4410",
          900: "#3d2d08",
        },
        champagne: {
          DEFAULT: "#f5e6c8",
          light: "#fdf8f0",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 4px 24px rgba(12, 20, 40, 0.12)",
        "luxury-lg": "0 8px 48px rgba(12, 20, 40, 0.18)",
        gold: "0 0 0 2px rgba(184, 146, 42, 0.4)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0c1428 0%, #1a2d5a 60%, #2d1f0e 100%)",
        "gold-gradient": "linear-gradient(135deg, #b8922a, #e8c560)",
        "card-gradient": "linear-gradient(180deg, rgba(12,20,40,0) 60%, rgba(12,20,40,0.85) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
