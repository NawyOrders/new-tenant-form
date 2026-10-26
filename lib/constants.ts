// This file holds the constants of the wizard: the steps, the mock brand colors,
// the mock plans, the features of the plans, and the map defaults.

import { theme } from "./theme";
import type { Branch, BilingualText, DurationMonths, Plan, RecommendedPalette, StepInfo } from "./types";

/** The ordered list of step keys. Reordering this array moves a step. */
export const STEP_ORDER: string[] = ["main", "identity", "branches", "package"];

/** The number of steps of the wizard. */
export const TOTAL_STEPS = STEP_ORDER.length;

/** The maximum number of branches a restaurant can have. */
export const MAX_BRANCHES = 2;

/** The maximum size of the logo file, in MB. */
export const MAX_LOGO_SIZE_MB = 5;

/** The maximum size of the menu file, in MB. */
export const MAX_MENU_SIZE_MB = 10;

/** The file types accepted for the logo. */
export const ACCEPTED_LOGO_TYPES: string[] = ["image/png", "image/jpeg", "image/svg+xml"];

/** The same types, in the format the file input wants. */
export const ACCEPTED_LOGO_INPUT = "image/png,image/jpeg,image/svg+xml";

/** The file types accepted for the menu. */
export const ACCEPTED_MENU_TYPES: string[] = ["application/pdf", "image/png", "image/jpeg"];

/** The same types, in the format the file input wants. */
export const ACCEPTED_MENU_INPUT = "application/pdf,image/png,image/jpeg";

/** The steps of the wizard built from STEP_ORDER. The titles are translation keys. */
export const STEPS: StepInfo[] = STEP_ORDER.map((key, index) => ({
  id: index + 1,
  titleKey: `step.${key}`,
}));

/** The OpenStreetMap tiles. */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** The attribution of the OpenStreetMap tiles. It must stay visible. */
export const TILE_ATTRIBUTION = "© OpenStreetMap contributors";

/** The center of the map when the restaurant did not choose a location yet (Alexandria). */
export const DEFAULT_MAP_CENTER = { latitude: 31.2001, longitude: 29.9187 };

/** The zoom of the map when the restaurant did not choose a location yet. */
export const DEFAULT_MAP_ZOOM = 13;

/** The zoom used when the map moves to a chosen location. */
export const LOCATION_MAP_ZOOM = 15;

/** The colors used by the preview when the restaurant did not choose its own colors yet. */
export const DEFAULT_BRAND_COLORS = {
  primaryColor: theme.primary,
  backgroundColor: theme.card,
  accentColor: theme.primaryLight,
} as const;

/**
 * The recommended color sets of step 2. MOCK data for now, they will come from the backend later.
 */
export const RECOMMENDED_PALETTES: RecommendedPalette[] = [
  {
    id: "nawy-red",
    name: { ar: "احمر nawy", en: "Nawy red" },
    primaryColor: theme.primary,
    backgroundColor: theme.card,
    accentColor: theme.primaryLight,
  },
  {
    id: "warm-terracotta",
    name: { ar: "طوبي", en: "Terracotta" },
    primaryColor: theme.primaryDark,
    backgroundColor: theme.bg,
    accentColor: theme.primary,
  },
  {
    id: "olive-green",
    name: { ar: "اخضر زيتوني", en: "Olive green" },
    primaryColor: theme.success.fg,
    backgroundColor: theme.card,
    accentColor: "#2FA35C",
  },
  {
    id: "deep-blue",
    name: { ar: "ازرق عميق", en: "Deep blue" },
    primaryColor: theme.info.fg,
    backgroundColor: theme.card,
    accentColor: "#4C7BF0",
  },
];

/** The features shared by both plans. MOCK data for now, they will come from the backend later. */
export const FEATURES: Array<{ id: string; label: BilingualText }> = [
  { id: "apps", label: { ar: "تطبيق للاندرويد والايفون", en: "Android and iOS app" } },
  { id: "reports", label: { ar: "تقارير المبيعات اليومية", en: "Daily sales reports" } },
  { id: "menu", label: { ar: "ادارة المنيو والاصناف", en: "Menu and item management" } },
  { id: "support", label: { ar: "دعم عبر البريد الالكتروني", en: "Email support" } },
];

/** The allowed subscription durations, in months. */
export const DURATIONS: DurationMonths[] = [3, 6, 12];

/** The plans of step 4. MOCK data for now, they will come from the backend later. */
export const PLANS: Plan[] = [
  {
    id: "starter",
    prices: { 3: 15000, 6: 32000, 12: 60000 },
    tagKeys: [],
  },
  {
    id: "growth",
    prices: { 3: 17000, 6: 34000, 12: 62000 },
    tagKeys: ["package.popular", "package.mostOrdered"],
  },
];

/** The total price of a plan for the chosen duration. */
export function getPlanPrice(plan: Plan, duration: DurationMonths): number {
  return plan.prices[duration];
}

/** A new empty branch, with the default opening hours. */
export function createEmptyBranch(): Branch {
  return {
    id: Date.now(),
    name: "",
    address: "",
    latitude: null,
    longitude: null,
    openingTime: "10:00",
    closingTime: "23:00",
  };
}
