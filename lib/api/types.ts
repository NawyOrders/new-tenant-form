// This file holds the types of the backend response wrapper, of the API errors,
// and of the onboarding upload endpoints.

/** The wrapper the backend puts around every response. */
export type ApiEnvelope<T> = {
  statusCode: number;
  isSuccess: boolean;
  data: T;
  errors: unknown;
  timestamp: string;
};

/** Why an API call failed. */
export type ApiErrorKind = "network" | "timeout" | "server" | "missing_config";

/** The kind of an onboarding file. TODO: confirm with the backend that 1 is the logo and 2 is the menu. */
export type UploadFileType = 1 | 2;

/** One file asked for in the upload-urls request. */
export type UploadRequestFile = {
  type: UploadFileType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

/** One upload target returned by the upload-urls endpoint. */
export type UploadUrlItem = {
  assetId: string;
  uploadToken: string;
  uploadUrl: string;
  /** When the upload URL stops working (ISO date), null when the backend did not send it. */
  expiresAtUtc: string | null;
  contentType: string;
  maximumSizeBytes: number;
};

/** The colors the palette endpoint read from the logo. */
export type LogoPaletteColors = {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
};

/** The design tokens returned beside the palette. */
export type LogoPaletteTokens = {
  accentMain: string | null;
};

/** The extra information of the palette endpoint. */
export type LogoPaletteMeta = {
  warnings: string[];
};

/** The preview data of the palette endpoint, including the contrast check. */
export type LogoPalettePreview = {
  cardBgColor: string | null;
  primaryContrastRatio: number | null;
  isWcagCompliant: boolean | null;
};

/** The data of POST /api/v1/onboarding/logo-palette. */
export type LogoPaletteData = {
  palette: LogoPaletteColors;
  tokens: LogoPaletteTokens;
  meta: LogoPaletteMeta;
  preview: LogoPalettePreview;
};
