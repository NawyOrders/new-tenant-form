// This file is step 2 "هوية المطعم": it shows the logo of step 1 (read only) and lets the
// visitor choose the colors of the brand.
// There is NO upload control here: to change the logo the visitor goes back to step 1.

"use client";

import type { ReactElement } from "react";
import Button from "@/components/ui/Button";
import { RECOMMENDED_PALETTES } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { theme } from "@/lib/theme";
import { isValidHexColor } from "@/lib/validation";
import type { Lang, RegisterData, StepErrors } from "@/lib/types";

type Step2IdentityProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  /** The local picture of the logo. */
  logoUrl: string | null;
  onChange: (patch: Partial<RegisterData>) => void;
  /** Goes back to step 1, the only place where the logo can be uploaded. */
  onEditLogo: () => void;
};

export default function Step2Identity({
  data,
  errors,
  lang,
  logoUrl,
  onChange,
  onEditLogo,
}: Step2IdentityProps): ReactElement {
  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.2")}</h2>

      <div className="mt-6 space-y-6">
        {/* The logo is read only here. To change it, the visitor goes back to step 1. */}
        <div className="flex items-center gap-4 rounded-panel border border-line bg-soft/40 p-4">
          {logoUrl === null ? (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-panel border border-dashed border-line text-xs text-muted">
              {t(lang, "field.logo.missing")}
            </span>
          ) : (
            // The logo is a local file, so a normal <img> is the right element here.
            // eslint-disable-next-line @next/next/no-img-element -- a local blob address cannot go through next/image
            <img
              src={logoUrl}
              alt={t(lang, "identity.logo")}
              className="h-16 w-16 shrink-0 rounded-panel border border-line bg-card object-contain p-1"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t(lang, "identity.logo")}</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {data.logoFile === null ? t(lang, "field.logo.missing") : data.logoFile.name}
            </p>
          </div>

          <Button variant="secondary" onClick={onEditLogo}>
            {t(lang, "btn.change")}
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-7 text-ink">{t(lang, "identity.heading")}</h3>

          <div className="mt-4 space-y-5">
            <ColorField
              label={t(lang, "identity.primary")}
              value={data.brand.primaryColor}
              error={errors["brand.primaryColor"]}
              lang={lang}
              isRequired
              onChange={(value) => onChange({ brand: { ...data.brand, primaryColor: value } })}
            />

            <ColorField
              label={t(lang, "identity.background")}
              value={data.brand.backgroundColor}
              error={errors["brand.backgroundColor"]}
              lang={lang}
              onChange={(value) => onChange({ brand: { ...data.brand, backgroundColor: value } })}
            />

            <ColorField
              label={t(lang, "identity.accent")}
              value={data.brand.accentColor}
              error={errors["brand.accentColor"]}
              lang={lang}
              isOptional
              onChange={(value) => onChange({ brand: { ...data.brand, accentColor: value } })}
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ink">{t(lang, "identity.recommended")}</h3>

          {/* MOCK palettes for now (lib/constants.ts). Later they will come from the backend. */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RECOMMENDED_PALETTES.map((palette) => {
              const isSelected: boolean =
                data.brand.primaryColor.toLowerCase() === palette.primaryColor.toLowerCase();

              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      brand: {
                        primaryColor: palette.primaryColor,
                        backgroundColor: palette.backgroundColor,
                        accentColor: palette.accentColor,
                      },
                    })
                  }
                  aria-pressed={isSelected}
                  className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected ? "border-primary bg-primary/5" : "border-line bg-card hover:border-primary/60"
                  }`}
                >
                  <span className="flex gap-1.5">
                    <span
                      className="h-6 w-6 rounded-full border border-line"
                      style={{ backgroundColor: palette.primaryColor }}
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-line"
                      style={{ backgroundColor: palette.backgroundColor }}
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-line"
                      style={{ backgroundColor: palette.accentColor }}
                    />
                  </span>
                  <span className="mt-2 block truncate text-xs font-semibold text-ink">
                    {palette.name[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type ColorFieldProps = {
  label: string;
  /** The hex value of the color, as the visitor typed it. */
  value: string;
  error?: string;
  lang: Lang;
  isRequired?: boolean;
  isOptional?: boolean;
  onChange: (value: string) => void;
};

/** One color row: the native color picker plus a text field for the hex value. */
function ColorField({
  label,
  value,
  error,
  lang,
  isRequired = false,
  isOptional = false,
  onChange,
}: ColorFieldProps): ReactElement {
  const hasError: boolean = error !== undefined && error !== "";
  // The native picker only understands real hex colors, so an empty value shows the theme color.
  const pickerValue: string = isValidHexColor(value) ? value : theme.primary;

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {isRequired ? <span className="text-danger-strong"> *</span> : null}
        {isOptional ? <span className="ms-2 text-xs font-normal text-muted">({t(lang, "identity.optional")})</span> : null}
      </span>

      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={label}
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-12 w-14 shrink-0 cursor-pointer rounded-panel border border-line bg-card p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
        />

        <input
          type="text"
          dir="ltr"
          aria-label={`${label} - ${t(lang, "identity.hex")}`}
          placeholder={t(lang, "identity.hex.placeholder")}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={hasError}
          className={`h-12 w-full min-w-0 rounded-panel border bg-card px-4 text-start text-sm uppercase text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/30 ${
            hasError ? "border-danger-strong" : "border-line"
          }`}
        />
      </div>

      {hasError ? (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-danger-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
