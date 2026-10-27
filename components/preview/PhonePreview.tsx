// This file draws the phone frame of the live preview: it shows the customer page of the
// restaurant with EVERY value the visitor typed, updated instantly.
// It reads the same state object as the form and never makes a network call.

"use client";

import type { ReactElement } from "react";
import PreviewBranch from "./PreviewBranch";
import { DEFAULT_BRAND_COLORS } from "@/lib/constants";
import { formatNumber, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { theme } from "@/lib/theme";
import { isValidArabicName, isValidEmail, isValidEnglishName, isValidHexColor, isValidName } from "@/lib/validation";
import type { ActiveSubscriptionOffer, Lang, RegisterData } from "@/lib/types";

type PhonePreviewProps = {
  data: RegisterData;
  lang: Lang;
  /** The local picture of the logo. */
  logoUrl: string | null;
  /** The local address of the menu file, used to open it. */
  menuUrl: string | null;
  /** The offer chosen in step 4, null when nothing is chosen yet. */
  selectedOffer: ActiveSubscriptionOffer | null;
};

export default function PhonePreview({
  data,
  lang,
  logoUrl,
  menuUrl,
  selectedOffer,
}: PhonePreviewProps): ReactElement {
  // The colors of the customer page. When the restaurant did not choose one, the theme color is used.
  const primaryColor: string = isValidHexColor(data.brand.primaryColor)
    ? data.brand.primaryColor
    : DEFAULT_BRAND_COLORS.primaryColor;
  const backgroundColor: string = isValidHexColor(data.brand.backgroundColor)
    ? data.brand.backgroundColor
    : DEFAULT_BRAND_COLORS.backgroundColor;
  const accentColor: string = isValidHexColor(data.brand.accentColor)
    ? data.brand.accentColor
    : DEFAULT_BRAND_COLORS.accentColor;

  // The text colors follow the brightness of the background color of the restaurant.
  const isLightBackground: boolean = isLightColor(backgroundColor);
  const textColor: string = isLightBackground ? theme.text : theme.card;
  const mutedColor: string = isLightBackground ? theme.textMuted : theme.bgSecondary;
  const panelColor: string = isLightBackground ? theme.bg : theme.text;

  const restaurantNameAr: string = previewName(data.restaurantNameAr, "ar", lang);
  const restaurantNameEn: string = previewName(data.restaurantNameEn, "en", lang);

  const ownerName: string =
    data.owner.fullName.trim() === ""
      ? ""
      : isValidName(data.owner.fullName)
        ? data.owner.fullName
        : t(lang, "field.ownerName.placeholder");

  const ownerEmail: string =
    data.owner.email.trim() === ""
      ? ""
      : isValidEmail(data.owner.email)
        ? data.owner.email
        : t(lang, "field.email.placeholder");

  const infoRows: Array<{ label: string; value: string }> = [
    { label: t(lang, "preview.owner"), value: ownerName },
    { label: t(lang, "preview.phone"), value: data.owner.phone.trim() },
    { label: t(lang, "preview.email"), value: ownerEmail },
  ];

  /** Opens the menu file that the visitor chose, straight from the browser. */
  function handleOpenMenu(): void {
    if (menuUrl === null) {
      return;
    }

    window.open(menuUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="rounded-[36px] border border-line bg-card p-2 shadow-card">
        <div
          className="h-[640px] overflow-y-auto rounded-[26px] border border-line"
          style={{ backgroundColor: backgroundColor, color: textColor }}
        >
          {/* The header of the customer page, painted with the color of the brand. */}
          <header className="px-4 pb-4 pt-5" style={{ backgroundColor: primaryColor }}>
            <span className="inline-flex rounded-pill bg-card/20 px-2 py-0.5 text-[10px] font-semibold text-card">
              {t(lang, "preview.label")}
            </span>

            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-panel bg-card/90 text-base font-semibold text-ink">
                {logoUrl === null ? (
                  restaurantNameAr.charAt(0)
                ) : (
                  // The logo is a local file, so a normal <img> is the right element here.
                  // eslint-disable-next-line @next/next/no-img-element -- a local blob address cannot go through next/image
                  <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-card">{restaurantNameAr}</span>
                <span className="block truncate text-[11px] font-medium text-card/90" dir="ltr">
                  {restaurantNameEn}
                </span>
                <span className="block text-[11px] text-card/85">
                  {data.branches.length} {t(lang, "preview.branches")} · {t(lang, "app.brand")}
                </span>
              </span>
            </div>

            <span className="mt-3 flex gap-1.5">
              <span className="h-4 w-4 rounded-full border border-card/40" style={{ backgroundColor: primaryColor }} />
              <span className="h-4 w-4 rounded-full border border-card/40" style={{ backgroundColor: backgroundColor }} />
              <span className="h-4 w-4 rounded-full border border-card/40" style={{ backgroundColor: accentColor }} />
            </span>
          </header>

          <div className="space-y-3 px-3 py-3">
            {/* The details of the restaurant. */}
            <section className="rounded-panel border border-line p-3" style={{ backgroundColor: panelColor }}>
              <p className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {t(lang, "preview.restaurant")}
              </p>

              {infoRows.map((row) => (
                <p key={row.label} className="mt-1 flex items-start justify-between gap-2 text-[11px]">
                  <span className="shrink-0" style={{ color: mutedColor }}>
                    {row.label}
                  </span>
                  <span className="min-w-0 break-words text-end font-semibold">
                    {row.value === "" ? t(lang, "preview.emptyValue") : row.value}
                  </span>
                </p>
              ))}
            </section>

            {/* The branches of the restaurant. */}
            <section>
              <p className="mb-2 text-[11px] font-semibold" style={{ color: accentColor }}>
                {t(lang, "preview.branches")}
              </p>

              <div className="space-y-2">
                {data.branches.length === 0 ? (
                  <p className="rounded-panel border border-line p-3 text-[11px]" style={{ color: mutedColor }}>
                    {t(lang, "preview.noBranches")}
                  </p>
                ) : (
                  data.branches.map((branch, index) => (
                    <PreviewBranch
                      key={branch.id}
                      branch={branch}
                      index={index}
                      lang={lang}
                      accentColor={accentColor}
                      textColor={textColor}
                      mutedColor={mutedColor}
                      panelColor={panelColor}
                    />
                  ))
                )}
              </div>
            </section>

            {/* The menu of the restaurant. */}
            <section className="rounded-panel border border-line p-3" style={{ backgroundColor: panelColor }}>
              <p className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {t(lang, "preview.menu")}
              </p>

              {data.menuFile === null ? (
                <p className="mt-1 text-[11px]" style={{ color: mutedColor }}>
                  {t(lang, "preview.noMenu")}
                </p>
              ) : (
                <>
                  <p className="mt-1 truncate text-[11px] font-semibold">{data.menuFile.name}</p>
                  <button
                    type="button"
                    onClick={handleOpenMenu}
                    className="mt-2 h-9 w-full rounded-pill text-[11px] font-semibold text-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ backgroundColor: accentColor }}
                  >
                    {t(lang, "preview.viewMenu")}
                  </button>
                </>
              )}
            </section>

            {/* The package of the restaurant. */}
            <section className="rounded-panel border border-line p-3" style={{ backgroundColor: panelColor }}>
              <p className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {t(lang, "preview.plan")}
              </p>

              {selectedOffer === null ? (
                <p className="mt-1 text-[11px]" style={{ color: mutedColor }}>
                  {t(lang, "package.noSelection")}
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold">
                  {packageName(lang, selectedOffer.packageCode)} —{" "}
                  {durationLabel(lang, selectedOffer.durationMonths)} —{" "}
                  {formatNumber(lang, selectedOffer.price)} {selectedOffer.currency}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The name of a package: known codes are translated, unknown codes stay as they are. */
function packageName(lang: Lang, packageCode: string): string {
  if (packageCode === "start") {
    return t(lang, "package.plan.starter");
  }

  if (packageCode === "growth") {
    return t(lang, "package.plan.growth");
  }

  return packageCode;
}

/** The label of one duration in months. */
function durationLabel(lang: Lang, months: number): string {
  if (months === 3) return t(lang, "package.months3");
  if (months === 6) return t(lang, "package.months6");
  if (months === 12) return t(lang, "package.months12");
  return t(lang, "package.monthsCount", { count: months });
}

/** The name shown in the preview: the real name, or its placeholder when empty or invalid. */
function previewName(value: string, script: "ar" | "en", lang: Lang): string {
  const placeholderKey: TranslationKey =
    script === "ar" ? "field.restaurantNameAr.placeholder" : "field.restaurantNameEn.placeholder";

  if (value.trim() === "") {
    return t(lang, placeholderKey);
  }

  const isValid: boolean = script === "ar" ? isValidArabicName(value) : isValidEnglishName(value);

  return isValid ? value : t(lang, placeholderKey);
}

/** True when the color is light, so the text on top of it must be dark. */
function isLightColor(hexColor: string): boolean {
  const red: number = Number.parseInt(hexColor.slice(1, 3), 16);
  const green: number = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue: number = Number.parseInt(hexColor.slice(5, 7), 16);

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return true;
  }

  return (red * 299 + green * 587 + blue * 114) / 1000 > 150;
}
