// This file holds every shared TypeScript type of the registration app.

/** The two languages of the app. */
export type Lang = "ar" | "en";

/** One subscription offer returned by the backend. */
export type ActiveSubscriptionOffer = {
  id: string; // uuid
  packageCode: string; // for example "start" or "growth"
  termCode: string | null;
  durationMonths: number;
  price: number;
  currency: string; // for example "EGP"
};

/** The loading state of the offers of the package step. */
export type OffersStatus = "idle" | "loading" | "ready" | "failed";

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
  restaurantNameAr: string;
  restaurantNameEn: string;
  logoFile: File | null; // kept for the local preview and for a retry after a failed upload
  menuFile: File | null; // kept for the local preview and for a retry after a failed upload
  logoAssetId: string | null;
  logoUploadToken: string | null;
  menuAssetId: string | null;
  menuUploadToken: string | null;
  owner: OwnerInfo;
  brand: BrandColors;
  branches: Branch[]; // max 2
  subscriptionOfferId: string | null;
};

/** The state of one file upload (the logo or the menu). */
export type UploadStatus = "idle" | "uploading" | "done" | "failed";

/** The message key shown when an upload fails. Each step of the upload has its own key. */
export type UploadErrorKey =
  | "upload.tooLarge"
  | "upload.failed"
  | "error.apiMissingConfig"
  | "upload.step.uploadUrls"
  | "upload.step.put"
  | "upload.step.confirm";

/** The state of one file upload, kept beside the file in the wizard. */
export type UploadState = {
  status: UploadStatus;
  errorKey: UploadErrorKey | null;
};

/** A text that exists in both languages (used by the mock features and palettes). */
export type BilingualText = {
  ar: string;
  en: string;
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

/** What the backend returns after a successful submit. */
export type SubmitResult = {
  requestId: string;
};

/** One branch in the body of the registration request. */
export type OnboardingBranchPayload = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  countryCode: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  sortOrder: number;
  workingHours: null;
};

/** The body of POST /api/v1/onboarding-requests. */
export type OnboardingSubmitPayload = {
  restaurantNameEn: string;
  restaurantNameAr: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  subscriptionOfferId: string;
  logoAssetId: string;
  logoUploadToken: string;
  menuAssetId: string;
  menuUploadToken: string;
  branches: OnboardingBranchPayload[];
};
