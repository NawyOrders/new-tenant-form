// This file draws the phone frame of the live preview: it shows the customer page of the
// restaurant with EVERY value the visitor typed, updated instantly.
// It reads the same state object as the form and never makes a network call.

"use client";

import type { ReactElement } from "react";
import PreviewBranch from "./PreviewBranch";
import { DEFAULT_BRAND_COLORS, PLANS, getPlanPrice } from "@/lib/constants";
import { formatNumber, t } from "@/lib/i18n";
import { theme } from "@/lib/theme";
import { isValidHexColor } from "@/lib/validation";
import type { Lang, RegisterData } from "@/lib/types";

type PhonePreviewProps = {
  data: RegisterData;
  lang: Lang;
  /** The local picture of the logo. */
  logoUrl: string | null;
  /** The local address of the menu file, used to open it. */
  menuUrl: string | null;
};

export default function PhonePreview({
  data,
  lang,
  logoUrl,
  menuUrl,
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

  const restaurantName: string =
    data.restaurantName.trim() === "" ? t(lang, "preview.emptyName") : data.restaurantName;

  const chosenPlan = PLANS.find((plan) => plan.id === data.planId) ?? null;
  const chosenDuration = data.durationMonths;

  const infoRows: Array<{ label: string; value: string }> = [
    { label: t(lang, "preview.owner"), value: data.owner.fullName.trim() },
    { label: t(lang, "preview.phone"), value: data.owner.phone.trim() },
    { label: t(lang, "preview.email"), value: data.owner.email.trim() },
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
                  restaurantName.charAt(0)
                ) : (
                  // The logo is a local file, so a normal <img> is the right element here.
                  // eslint-disable-next-line @next/next/no-img-element -- a local blob address cannot go through next/image
                  <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-card">{restaurantName}</span>
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

              {chosenPlan === null || chosenDuration === null ? (
                <p className="mt-1 text-[11px]" style={{ color: mutedColor }}>
                  {t(lang, "package.noSelection")}
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold">
                  {chosenPlan.id === "starter"
                    ? t(lang, "package.plan.starter")
                    : t(lang, "package.plan.growth")}{" "}
                  —{" "}
                  {chosenDuration === 3
                    ? t(lang, "package.months3")
                    : chosenDuration === 6
                      ? t(lang, "package.months6")
                      : t(lang, "package.months12")}{" "}
                  — {formatNumber(lang, getPlanPrice(chosenPlan, chosenDuration))}{" "}
                  {t(lang, "package.perEgp")}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
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
