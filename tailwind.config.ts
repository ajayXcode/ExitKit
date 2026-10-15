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
        exitText: "#080909",
        exitBg: "#dfe4f2",
        exitLavender: "#f0eefa",
        exitBadge: "#f7f8fa",
        exitCard: "#ffffff",
        exitBorder: "#e2e8f0",
      },
      fontFamily: {
        epilogue: ["'Epilogue'", "system-ui", "sans-serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      screens: {
        desktop: "701px",
      },
    },
  },
  plugins: [],
};

export default config;
