// This file asks the backend for color suggestions that match the restaurant logo.
// The endpoint is public and multipart, and it can be slow, so it gets its own timeout.

import { ApiError, apiPostForm } from "./client";
import type {
  LogoPaletteColors,
  LogoPaletteData,
  LogoPaletteMeta,
  LogoPalettePreview,
  LogoPaletteTokens,
} from "./types";
import type { LogoPaletteResult, PaletteSuggestion } from "@/lib/types";

const LOGO_PALETTE_PATH = "/api/v1/onboarding/logo-palette";
const PALETTE_TIMEOUT_MS = 30_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sameColor(a: string, b: string | null): boolean {
  return b !== null && a.toLowerCase() === b.toLowerCase();
}

/** Reads the response safely. A missing part becomes null, so the UI can fall back. */
function toPaletteData(value: unknown): LogoPaletteData {
  const data = asRecord(value);

  if (data === null) {
    throw new ApiError("server", "The palette response is empty");
  }

  const palette = asRecord(data.palette);
  const tokens = asRecord(data.tokens);
  const accent = tokens !== null ? asRecord(tokens.accent) : null;
  const meta = asRecord(data.meta);
  const preview = asRecord(data.preview);
  const warningsValue: unknown[] = meta !== null && Array.isArray(meta.warnings) ? meta.warnings : [];
  const warnings: string[] = warningsValue.filter(
    (item): item is string => typeof item === "string" && item !== "",
  );

  const colors: LogoPaletteColors = {
    primary: palette !== null ? asString(palette.primary) : null,
    secondary: palette !== null ? asString(palette.secondary) : null,
    accent: palette !== null ? asString(palette.accent) : null,
  };
  const tokenColors: LogoPaletteTokens = { accentMain: accent !== null ? asString(accent.main) : null };
  const metaData: LogoPaletteMeta = { warnings };
  const previewData: LogoPalettePreview = {
    cardBgColor: preview !== null ? asString(preview.cardBgColor) : null,
    primaryContrastRatio: preview !== null ? asNumber(preview.primaryContrastRatio) : null,
    isWcagCompliant:
      preview !== null && typeof preview.isWcagCompliant === "boolean" ? preview.isWcagCompliant : null,
  };

  return { palette: colors, tokens: tokenColors, meta: metaData, preview: previewData };
}

/** Builds the three suggestions from the backend values, dropping any incomplete one. */
function toSuggestions(data: LogoPaletteData): PaletteSuggestion[] {
  const { primary, secondary, accent } = data.palette;
  const cardBackground: string | null = data.preview.cardBgColor;
  const tokenAccent: string | null = data.tokens.accentMain;
  const options: PaletteSuggestion[] = [];

  if (primary !== null && accent !== null && cardBackground !== null) {
    options.push({ id: "option1", primaryColor: primary, backgroundColor: cardBackground, accentColor: accent });
  }

  if (secondary !== null && accent !== null && cardBackground !== null && !sameColor(secondary, primary)) {
    options.push({ id: "option2", primaryColor: secondary, backgroundColor: cardBackground, accentColor: accent });
  }

  const usedPrimaries: string[] = options.map((option) => option.primaryColor);
  if (
    tokenAccent !== null &&
    primary !== null &&
    cardBackground !== null &&
    !usedPrimaries.some((color) => sameColor(color, tokenAccent))
  ) {
    options.push({ id: "option3", primaryColor: tokenAccent, backgroundColor: cardBackground, accentColor: primary });
  }

  return options;
}

/** Sends the same logo file that step 1 keeps, and maps the answer to the suggestions. */
export async function getLogoPalette(file: File): Promise<LogoPaletteResult> {
  const form = new FormData();
  form.append("file", file);

  const response: unknown = await apiPostForm<unknown>(LOGO_PALETTE_PATH, form, PALETTE_TIMEOUT_MS);
  const data: LogoPaletteData = toPaletteData(response);

  return {
    options: toSuggestions(data),
    warnings: data.meta.warnings,
    contrastRatio: data.preview.primaryContrastRatio,
    isWcagCompliant: data.preview.isWcagCompliant !== false,
  };
}
