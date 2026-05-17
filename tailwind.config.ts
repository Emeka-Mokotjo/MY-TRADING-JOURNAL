import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050714",
        background2: "#090d1f",
        card: "#0b1224",
        card2: "#111827",
        foreground: "#eff1ff",
        muted: "#8b95b8",
        border: "#18203b",
        primary: "#7c3aed",
        success: "#22c55e",
        danger: "#fb7185",
        warning: "#fbbf24",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
