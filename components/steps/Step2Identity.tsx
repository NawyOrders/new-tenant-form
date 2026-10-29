// This file is step 2 "هوية المطعم": the restaurant names (the same fields as step 1), the
// logo (it can be changed here, without going back), and the brand colors.
// The three palettes are computed in the browser from the logo itself.

"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { uploadLogo } from "@/lib/api/uploads";
import {
  ACCEPTED_LOGO_INPUT,
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SIZE_MB,
  RECOMMENDED_PALETTES,
} from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { buildPalettes } from "@/lib/palette/buildPalettes";
import type { BuiltPalette, PaletteName } from "@/lib/palette/buildPalettes";
import { extractDominantColors } from "@/lib/palette/extractPalette";
import { theme } from "@/lib/theme";
import { isValidHexColor } from "@/lib/validation";
import type { BrandColors, Lang, RegisterData, StepErrors } from "@/lib/types";

type Step2IdentityProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  /** The local picture of the logo kept in the form. */
  logoUrl: string | null;
  onChange: (patch: Partial<RegisterData>) => void;
  /** Called with the field key when a validated field loses focus. */
  onBlurField: (field: string) => void;
};

/** The name of each palette card. */
const PALETTE_LABEL_KEYS: Record<PaletteName, TranslationKey> = {
  brand: "identity.palette.brand",
  dark: "identity.palette.dark",
  contrast: "identity.palette.contrast",
};

function sameColor(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** A card is selected only when its three colors are the colors of the form. */
function hasColors(brand: BrandColors, colors: Omit<BuiltPalette, "name">): boolean {
  return (
    sameColor(brand.primaryColor, colors.primaryColor) &&
    sameColor(brand.backgroundColor, colors.backgroundColor) &&
    sameColor(brand.accentColor, colors.accentColor)
  );
}

export default function Step2Identity({
  data,
  errors,
  lang,
  logoUrl,
  onChange,
  onBlurField,
}: Step2IdentityProps): ReactElement {
  const [palettes, setPalettes] = useState<BuiltPalette[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFailed, setUploadFailed] = useState<boolean>(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadSeq = useRef<number>(0);

  // The palettes follow the logo: a new logo means new colors. They stay in this component.
  useEffect(() => {
    const file: File | null = data.logoFile;

    if (file === null) {
      setPalettes([]);
      setIsExtracting(false);
      return;
    }

    let cancelled = false;
    setIsExtracting(true);

    void extractDominantColors(file).then((colors) => {
      if (cancelled) {
        return;
      }

      setPalettes(buildPalettes(colors));
      setIsExtracting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [data.logoFile]);

  /** Uploads one logo and keeps the current one until the new file is accepted. */
  async function upload(file: File): Promise<void> {
    uploadSeq.current += 1;
    const seq: number = uploadSeq.current;
    setPendingLogo(file);
    setLogoError("");
    setUploadFailed(false);
    setIsUploading(true);

    try {
      const asset = await uploadLogo(file);

      if (seq !== uploadSeq.current) {
        return;
      }

      onChange({ logoFile: file, logoAssetId: asset.assetId });
      setPendingLogo(null);
      setIsUploading(false);
    } catch {
      if (seq !== uploadSeq.current) {
        return;
      }

      setUploadFailed(true);
      setIsUploading(false);
    }
  }

  function handlePicked(event: ChangeEvent<HTMLInputElement>): void {
    const file: File | null = event.target.files !== null ? (event.target.files[0] ?? null) : null;
    // The input is emptied so the same file can be picked again.
    event.target.value = "";

    if (file === null) {
      return;
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError(t(lang, "error.fileType"));
      return;
    }

    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setLogoError(t(lang, "upload.tooLarge"));
      return;
    }

    setLogoError("");
    void upload(file);
  }

  function applyColors(colors: Omit<BuiltPalette, "name">): void {
    onChange({
      brand: {
        primaryColor: colors.primaryColor,
        backgroundColor: colors.backgroundColor,
        accentColor: colors.accentColor,
      },
    });
  }

  function editColor(patch: Partial<BrandColors>): void {
    onChange({ brand: { ...data.brand, ...patch } });
  }

  const showFallback: boolean = !isExtracting && palettes.length === 0;

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.2")}</h2>

      <div className="mt-6 space-y-6">
        {/* The two names are the same fields as step 1. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label={t(lang, "field.restaurantNameAr")}
            name="identity-name-ar"
            placeholder={t(lang, "field.restaurantNameAr.placeholder")}
            value={data.restaurantNameAr}
            error={errors["restaurantNameAr"]}
            required
            onChange={(value) => onChange({ restaurantNameAr: value })}
            onBlur={() => onBlurField("restaurantNameAr")}
          />

          <TextInput
            label={t(lang, "field.restaurantNameEn")}
            name="identity-name-en"
            placeholder={t(lang, "field.restaurantNameEn.placeholder")}
            value={data.restaurantNameEn}
            error={errors["restaurantNameEn"]}
            required
            dir="ltr"
            onChange={(value) => onChange({ restaurantNameEn: value })}
            onBlur={() => onBlurField("restaurantNameEn")}
          />
        </div>

        {/* The logo can be changed here: the old picture stays until the new upload succeeds. */}
        <div className="rounded-panel border border-line bg-soft/40 p-4">
          <div className="flex items-center gap-4">
            {logoUrl === null ? (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-panel border border-dashed border-line p-1 text-center text-[10px] text-muted">
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

            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {t(lang, "btn.change")}
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_LOGO_INPUT}
              className="hidden"
              onChange={handlePicked}
            />
          </div>

          {isUploading ? (
            <p role="status" className="mt-3 text-xs font-semibold text-muted">
              {t(lang, "identity.logo.uploading")}
            </p>
          ) : null}

          {uploadFailed ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p role="alert" className="text-xs font-semibold text-danger-strong">
                {t(lang, "identity.logo.failed")}
              </p>
              {pendingLogo !== null ? (
                <Button variant="secondary" onClick={() => void upload(pendingLogo)}>
                  {t(lang, "upload.retry")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {logoError !== "" ? (
            <p role="alert" className="mt-3 text-xs font-semibold text-danger-strong">
              {logoError}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-muted">{t(lang, "field.logo.hint")}</p>
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
              onChange={(value) => editColor({ primaryColor: value })}
            />

            <ColorField
              label={t(lang, "identity.background")}
              value={data.brand.backgroundColor}
              error={errors["brand.backgroundColor"]}
              lang={lang}
              onChange={(value) => editColor({ backgroundColor: value })}
            />

            <ColorField
              label={t(lang, "identity.accent")}
              value={data.brand.accentColor}
              error={errors["brand.accentColor"]}
              lang={lang}
              isOptional
              onChange={(value) => editColor({ accentColor: value })}
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-ink">{t(lang, "identity.recommended")}</h3>

          {isExtracting ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              {t(lang, "identity.palette.loading")}
            </p>
          ) : null}

          {!isExtracting && palettes.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {palettes.map((palette) => (
                <PaletteCard
                  key={palette.name}
                  label={t(lang, PALETTE_LABEL_KEYS[palette.name])}
                  primary={palette.primaryColor}
                  background={palette.backgroundColor}
                  accent={palette.accentColor}
                  selected={hasColors(data.brand, palette)}
                  onSelect={() => applyColors(palette)}
                />
              ))}
            </div>
          ) : null}

          {showFallback ? (
            <>
              <p className="mt-2 text-xs text-muted">{t(lang, "identity.palette.fallback")}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RECOMMENDED_PALETTES.map((recommended) => (
                  <PaletteCard
                    key={recommended.id}
                    label={recommended.name[lang]}
                    primary={recommended.primaryColor}
                    background={recommended.backgroundColor}
                    accent={recommended.accentColor}
                    selected={hasColors(data.brand, recommended)}
                    onSelect={() => applyColors(recommended)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type PaletteCardProps = {
  label: string;
  primary: string;
  background: string;
  accent: string;
  selected: boolean;
  onSelect: () => void;
};

/** One palette card: the three colors and the name. */
function PaletteCard({
  label,
  primary,
  background,
  accent,
  selected,
  onSelect,
}: PaletteCardProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected ? "border-primary bg-primary/5" : "border-line bg-card hover:border-primary/60"
      }`}
    >
      <span className="flex gap-1.5">
        <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: primary }} />
        <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: background }} />
        <span className="h-6 w-6 rounded-full border border-line" style={{ backgroundColor: accent }} />
      </span>
      <span className="mt-2 block truncate text-xs font-semibold text-ink">{label}</span>
    </button>
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
