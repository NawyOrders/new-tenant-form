// This file holds ALL the colors and the shadows of the app.
// The light palette is confirmed and no component may write a hex color of its own.
export const theme = {
  bg: "#FDF8F3",
  bgSecondary: "#FFEFE3",
  card: "#FFFFFF",
  primary: "#E43820",
  primaryDark: "#B8251A",
  primaryLight: "#FF6B4A",
  text: "#1B1410",
  textMuted: "#7A6F69",
  border: "#F0E6DD",
  success: { bg: "#E6F6EC", fg: "#167A3E" },
  warning: { bg: "#FFF4D6", fg: "#9A6200" },
  danger: { bg: "#FDE7E4", fg: "#B8251A" },
  neutral: { bg: "#F3EEE9", fg: "#5E544D" },
  info: { bg: "#E8F0FE", fg: "#1F4FB4" },
  shadowCard: "0 1px 2px rgba(120,60,30,.04), 0 8px 24px rgba(120,60,30,.05)",
  shadowButton: "0 6px 16px rgba(228,56,32,.25)",
} as const;

/**
 * The same colors as flat Tailwind color names.
 * tailwind.config.ts reads this object, so `bg-primary` and `text-ink` always match the theme.
 */
export const themeColors = {
  page: theme.bg,
  soft: theme.bgSecondary,
  card: theme.card,
  primary: theme.primary,
  "primary-dark": theme.primaryDark,
  "primary-light": theme.primaryLight,
  ink: theme.text,
  muted: theme.textMuted,
  line: theme.border,
  "success-soft": theme.success.bg,
  "success-strong": theme.success.fg,
  "warning-soft": theme.warning.bg,
  "warning-strong": theme.warning.fg,
  "danger-soft": theme.danger.bg,
  "danger-strong": theme.danger.fg,
  "neutral-soft": theme.neutral.bg,
  "neutral-strong": theme.neutral.fg,
  "info-soft": theme.info.bg,
  "info-strong": theme.info.fg,
} as const;

/** The same colors as CSS variables, used by the global stylesheet (the Leaflet parts). */
export const themeCssVars: Record<string, string> = Object.fromEntries(
  Object.entries(themeColors).map(([name, value]) => [`--nawy-${name}`, value]),
);

/** The shadows as CSS variables, used the same way. */
export const themeShadowCssVars: Record<string, string> = {
  "--nawy-shadow-card": theme.shadowCard,
  "--nawy-shadow-button": theme.shadowButton,
  /** The soft ring around the marker of the map. */
  "--nawy-primary-ring": "rgba(228,56,32,.25)",
};

/** All CSS variables of the app in one string, injected once in the root layout. */
export function themeCssVariablesBlock(): string {
  const allVariables: Record<string, string> = { ...themeCssVars, ...themeShadowCssVars };

  return `:root{${Object.entries(allVariables)
    .map(([name, value]) => `${name}:${value}`)
    .join(";")};}`;
}
