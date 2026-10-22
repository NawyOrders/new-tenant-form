// This file is the Tailwind configuration. It reads the colors from lib/theme.ts,
// so the theme file stays the ONE place where the colors of the app are defined.

import type { Config } from "tailwindcss";
import { theme, themeColors } from "./lib/theme";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: themeColors,
      borderRadius: {
        card: "20px",
        panel: "12px",
        pill: "8px",
      },
      boxShadow: {
        card: theme.shadowCard,
        button: theme.shadowButton,
      },
    },
  },
  plugins: [],
};

export default config;
