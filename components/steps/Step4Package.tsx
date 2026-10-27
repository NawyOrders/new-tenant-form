// This file is step 4 "الباقة": it loads the offers from the backend and shows one card per
// package with one option per duration. The selected offer id is kept in the form state.

"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import Button from "@/components/ui/Button";
import { FEATURES } from "@/lib/constants";
import { formatNumber, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { ActiveSubscriptionOffer, Lang, OffersStatus, RegisterData, StepErrors } from "@/lib/types";

type Step4PackageProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  onChange: (patch: Partial<RegisterData>) => void;
  offers: ActiveSubscriptionOffer[];
  status: OffersStatus;
  /** The translation key of the error shown when the offers could not be loaded. */
  errorKey: TranslationKey;
  /** Loads the offers. Also used by the Retry button. */
  onLoadOffers: () => void;
};

type OfferGroup = {
  packageCode: string;
  options: ActiveSubscriptionOffer[];
};

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

/** Groups the offers by package code, keeping the backend order and sorting by duration. */
function groupOffers(offers: ActiveSubscriptionOffer[]): OfferGroup[] {
  const groups: OfferGroup[] = [];

  for (const offer of offers) {
    const group: OfferGroup | undefined = groups.find((item) => item.packageCode === offer.packageCode);

    if (group === undefined) {
      groups.push({ packageCode: offer.packageCode, options: [offer] });
    } else {
      group.options.push(offer);
    }
  }

  for (const group of groups) {
    group.options.sort((a, b) => a.durationMonths - b.durationMonths);
  }

  return groups;
}

export default function Step4Package({
  data,
  errors,
  lang,
  onChange,
  offers,
  status,
  errorKey,
  onLoadOffers,
}: Step4PackageProps): ReactElement {
  // The offers are loaded when this step opens, and again when the visitor retries.
  useEffect(() => {
    if (status === "idle") {
      onLoadOffers();
    }
  }, [status, onLoadOffers]);

  const groups: OfferGroup[] = groupOffers(offers);

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.4")}</h2>
      <p className="mt-2 text-sm text-muted">{t(lang, "package.heading")}</p>

      {status === "idle" || status === "loading" ? (
        <p className="mt-5 text-sm text-muted">{t(lang, "package.loading")}</p>
      ) : null}

      {status === "failed" ? (
        <div className="mt-5 rounded-panel bg-danger-soft px-4 py-3">
          <p role="alert" className="text-sm font-semibold text-danger-strong">
            {t(lang, errorKey)}
          </p>
          <Button variant="secondary" className="mt-3" onClick={onLoadOffers}>
            {t(lang, "package.retry")}
          </Button>
        </div>
      ) : null}

      {status === "ready" && groups.length === 0 ? (
        <p className="mt-5 text-sm text-muted">{t(lang, "package.noOffers")}</p>
      ) : null}

      {status === "ready" ? (
        <div className="mt-5 space-y-4">
          {groups.map((group) => {
            const isGroupSelected: boolean = group.options.some(
              (offer) => offer.id === data.subscriptionOfferId,
            );

            return (
              <section
                key={group.packageCode}
                className={`rounded-card border p-5 transition ${
                  isGroupSelected ? "border-primary bg-primary/5" : "border-line bg-card"
                }`}
              >
                <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                  {packageName(lang, group.packageCode)}
                  {isGroupSelected ? (
                    <span className="rounded-pill bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-strong">
                      {t(lang, "package.selected")}
                    </span>
                  ) : null}
                </p>

                <p className="mt-4 text-xs font-semibold text-ink">{t(lang, "package.duration")}</p>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {group.options.map((offer) => {
                    const isSelected: boolean = data.subscriptionOfferId === offer.id;

                    return (
                      <button
                        key={offer.id}
                        type="button"
                        onClick={() => onChange({ subscriptionOfferId: offer.id })}
                        aria-pressed={isSelected}
                        className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-line bg-soft/40 hover:border-primary/60"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-ink">
                          {durationLabel(lang, offer.durationMonths)}
                        </span>
                        <span className="mt-1 block text-sm font-semibold tabular-nums text-primary-dark">
                          {formatNumber(lang, offer.price)} {offer.currency}
                        </span>
                        {isSelected ? (
                          <span className="mt-1 block text-[11px] font-semibold text-success-strong">
                            {t(lang, "package.selected")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-4 text-xs font-semibold text-ink">{t(lang, "package.features")}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {FEATURES.map((feature) => (
                    <li
                      key={feature.id}
                      className="rounded-pill border border-line bg-soft/60 px-3 py-1 text-xs text-ink"
                    >
                      {feature.label[lang]}
                    </li>
                  ))}
                  {group.packageCode === "growth" ? (
                    <li className="rounded-pill border border-line bg-soft/60 px-3 py-1 text-xs text-ink">
                      {t(lang, "package.feature.ai")}
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}

      {errors["subscriptionOfferId"] !== undefined ? (
        <p role="alert" className="mt-4 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errors["subscriptionOfferId"]}
        </p>
      ) : null}
    </div>
  );
}
