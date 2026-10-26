// This file holds every shared TypeScript type of the registration app.

/** The two languages of the app. */
export type Lang = "ar" | "en";

/** The two plans of the app. */
export type PlanId = "starter" | "growth";

/** The allowed subscription durations, in months. */
export type DurationMonths = 3 | 6 | 12;

/** One restaurant branch (the app allows a maximum of 2). */
export type Branch = {
  id: number; // Date.now() when the branch is created
  name: string;
  address: string; // full address text
  latitude: number | null; // 6 decimal places
  longitude: number | null; // 6 decimal places
  openingTime: string; // "10:00"
  closingTime: string; // "23:00"
};

/** The person who owns the restaurant. */
export type OwnerInfo = {
  fullName: string;
  phone: string;
  email: string;
};

/** The colors the restaurant picked for its customer page. */
export type BrandColors = {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string; // an empty string means "not chosen yet"
};

/** The whole registration form. This is the ONE object kept in the RegisterWizard state. */
export type RegisterData = {
  restaurantName: string;
  logoFile: File | null; // used ONLY for the local preview for now
  menuFile: File | null; // used ONLY for the local preview for now
  owner: OwnerInfo;
  brand: BrandColors;
  branches: Branch[]; // max 2
  planId: PlanId | null;
  durationMonths: DurationMonths | null;
};

/** A text that exists in both languages (used by the mock plans and features). */
export type BilingualText = {
  ar: string;
  en: string;
};

/** One subscription plan (mock data for now, from lib/constants.ts). */
export type Plan = {
  id: PlanId;
  /** The total price in Egyptian pounds for each allowed duration. */
  prices: Record<DurationMonths, number>;
  /** Translation keys of the badges of the plan (for example "package.popular"). */
  tagKeys: string[];
};

/** One recommended color set (mock data for now, from lib/constants.ts). */
export type RecommendedPalette = {
  id: string;
  name: BilingualText;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
};

/** One step of the wizard (1, 2, 3 or 4). */
export type StepInfo = {
  id: number;
  titleKey: string;
};

/** The result of an OpenStreetMap (Nominatim) search. */
export type GeoResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

/** The result of an OpenStreetMap (Nominatim) reverse search. */
export type GeoAddress = {
  displayName: string;
};

/** Field errors: key = field name (for example "owner.phone"), value = the error message. */
export type StepErrors = Record<string, string>;

/** What the mock submit function returns. */
export type SubmitResult = {
  success: boolean;
  referenceId: string;
};

/** The body that will be sent to the backend when it is ready. */
export type SubmitPayload = {
  restaurant: { name: string };
  owner: { fullName: string; phone: string; email: string };
  brand: {
    primaryColor: string;
    backgroundColor: string;
    accentColor: string | null;
  };
  branches: Array<{
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    openingTime: string;
    closingTime: string;
  }>;
  package: { planId: PlanId; durationMonths: DurationMonths };
};
