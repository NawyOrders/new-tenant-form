// This file holds the constants of the wizard: the steps, the mock brand colors,
// the mock plans, the features of the plans, and the map defaults.

import { theme } from "./theme";
import type { BillingCycle, Branch, BilingualText, Plan, RecommendedPalette, StepInfo } from "./types";

/** The number of steps of the wizard. */
export const TOTAL_STEPS = 4;

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

/** The four steps of the wizard. The titles are translation keys. */
export const STEPS: StepInfo[] = [
  { id: 1, titleKey: "step.1" },
  { id: 2, titleKey: "step.2" },
  { id: 3, titleKey: "step.3" },
  { id: 4, titleKey: "step.4" },
];

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

/** The features every plan has. MOCK data for now, they will come from the backend later. */
export const FEATURES: Array<{ id: string; label: BilingualText }> = [
  { id: "apps", label: { ar: "تطبيق للاندرويد والايفون", en: "Android and iOS app" } },
  { id: "reports", label: { ar: "تقارير المبيعات اليومية", en: "Daily sales reports" } },
  { id: "menu", label: { ar: "ادارة المنيو والاصناف", en: "Menu and item management" } },
  { id: "support", label: { ar: "دعم عبر البريد الالكتروني", en: "Email support" } },
];

/** The plans of step 4. MOCK data for now, they will come from the backend later. */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: { ar: "ستارتير", en: "Starter" },
    description: { ar: "للمطاعم الي بتبدأ رحلتها", en: "For restaurants just starting out" },
    yearlyPrice: 32000,
    tagKeys: [],
  },
  {
    id: "growth",
    name: { ar: "نمو", en: "Growth" },
    description: { ar: "للمطاعم الي بتكبر وبتتوسع", en: "For restaurants that are growing" },
    yearlyPrice: 64000,
    tagKeys: ["package.popular", "package.mostOrdered"],
  },
];

/** The monthly price of a yearly price: the yearly price divided by 12. */
export function getMonthlyPrice(yearlyPrice: number): number {
  return Math.round(yearlyPrice / 12);
}

/** The price of a plan for the chosen billing cycle. */
export function getPlanPrice(plan: Plan, billingCycle: BillingCycle): number {
  return billingCycle === "monthly" ? getMonthlyPrice(plan.yearlyPrice) : plan.yearlyPrice;
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
