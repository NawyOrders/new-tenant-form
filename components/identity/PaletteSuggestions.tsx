// This file shows the color suggestions of the logo: the backend options, the loading and
// error states, the contrast note, and the ready palettes when there is no suggestion.

"use client";

import type { ReactElement } from "react";
import Button from "@/components/ui/Button";
import { RECOMMENDED_PALETTES } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { BrandColors, Lang, PaletteState, PaletteSuggestion } from "@/lib/types";

type PaletteSuggestionsProps = {
  lang: Lang;
  /** The suggestions and their state, owned by the wizard. */
  palette: PaletteState;
  /** The colors of the form, used to mark the selected card. */
  brand: BrandColors;
  /** Fills the brand colors from one card. */
  onSelect: (brand: BrandColors) => void;
  /** Asks for the suggestions again after a failure that can be retried. */
  onRetry: () => void;
};

/** The name of each suggestion, in the order the backend returned them. */
const OPTION_LABEL_KEYS: Record<PaletteSuggestion["id"], TranslationKey> = {
  option1: "identity.palette.option1",
  option2: "identity.palette.option2",
  option3: "identity.palette.option3",
};

function sameColor(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** A card is selected only when all three of its colors are the colors of the form. */
function isSelected(brand: BrandColors, primary: string, background: string, accent: string): boolean {
  return (
    sameColor(brand.primaryColor, primary) &&
    sameColor(brand.backgroundColor, background) &&
    sameColor(brand.accentColor, accent)
  );
}

function ColorDots({ primary, background, accent }: { primary: string; background: string; accent: string }): ReactElement {
  return (
    <span className="flex gap-1.5">
      <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: primary }} />
      <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: background }} />
      <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: accent }} />
    </span>
  );
}

export default function PaletteSuggestions({
  lang,
  palette,
  brand,
  onSelect,
  onRetry,
}: PaletteSuggestionsProps): ReactElement {
  const hasOptions: boolean = palette.status === "ready" && palette.options.length > 0;
  const showFallback: boolean = palette.status === "ready" && palette.options.length === 0;
  const showMockPalettes: boolean = palette.status === "idle" || showFallback || palette.status === "error";

  return (
    <div>
      <h3 className="text-base font-semibold text-ink">{t(lang, "identity.recommended")}</h3>

      {palette.status === "loading" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {t(lang, "identity.palette.loading")}
        </p>
      ) : null}

      {palette.status === "error" && palette.errorKey !== null ? (
        <div className="mt-3 rounded-panel bg-warning-soft px-4 py-3">
          <p role="alert" className="text-sm font-semibold text-warning-strong">
            {t(lang, palette.errorKey)}
          </p>

          {palette.canRetry ? (
            <Button variant="secondary" className="mt-3 h-10 px-4" onClick={onRetry}>
              {t(lang, "identity.palette.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {showFallback ? <p className="mt-2 text-xs text-muted">{t(lang, "identity.palette.fallback")}</p> : null}

      {hasOptions ? (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {palette.options.map((option) => {
              const selected: boolean = isSelected(
                brand,
                option.primaryColor,
                option.backgroundColor,
                option.accentColor,
              );

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onSelect({
                      primaryColor: option.primaryColor,
                      backgroundColor: option.backgroundColor,
                      accentColor: option.accentColor,
                    })
                  }
                  aria-pressed={selected}
                  className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selected ? "border-primary bg-primary/5" : "border-line bg-card hover:border-primary/60"
                  }`}
                >
                  <ColorDots
                    primary={option.primaryColor}
                    background={option.backgroundColor}
                    accent={option.accentColor}
                  />
                  <span className="mt-2 block truncate text-xs font-semibold text-ink">
                    {t(lang, OPTION_LABEL_KEYS[option.id])}
                  </span>
                </button>
              );
            })}
          </div>

          {palette.contrastRatio !== null ? (
            <p className="mt-2 text-xs text-muted" dir="ltr">
              {palette.contrastRatio.toFixed(2)}:1
            </p>
          ) : null}

          {!palette.isWcagCompliant ? (
            <p className="mt-1 text-xs font-semibold text-warning-strong">
              {t(lang, "identity.palette.lowContrast")}
            </p>
          ) : null}

          {palette.warnings.map((warning, index) => (
            <p key={`${index}-${warning}`} className="mt-1 text-xs text-muted">
              {warning}
            </p>
          ))}
        </>
      ) : null}

      {showMockPalettes ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RECOMMENDED_PALETTES.map((recommended) => {
            const selected: boolean = isSelected(
              brand,
              recommended.primaryColor,
              recommended.backgroundColor,
              recommended.accentColor,
            );

            return (
              <button
                key={recommended.id}
                type="button"
                onClick={() =>
                  onSelect({
                    primaryColor: recommended.primaryColor,
                    backgroundColor: recommended.backgroundColor,
                    accentColor: recommended.accentColor,
                  })
                }
                aria-pressed={selected}
                className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected ? "border-primary bg-primary/5" : "border-line bg-card hover:border-primary/60"
                }`}
              >
                <ColorDots
                  primary={recommended.primaryColor}
                  background={recommended.backgroundColor}
                  accent={recommended.accentColor}
                />
                <span className="mt-2 block truncate text-xs font-semibold text-ink">{recommended.name[lang]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
