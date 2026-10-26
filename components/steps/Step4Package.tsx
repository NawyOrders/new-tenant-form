// This file is step 4 "الباقة": the two plans and the subscription duration of each one.

"use client";

import type { ReactElement } from "react";
import { DURATIONS, FEATURES, PLANS, getPlanPrice } from "@/lib/constants";
import { formatNumber, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { DurationMonths, Lang, PlanId, RegisterData, StepErrors } from "@/lib/types";

type Step4PackageProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  onChange: (patch: Partial<RegisterData>) => void;
};

/** The translation key of one plan name. */
function planNameKey(planId: PlanId): TranslationKey {
  return planId === "starter" ? "package.plan.starter" : "package.plan.growth";
}

/** The translation key of one duration label. */
function durationKey(duration: DurationMonths): TranslationKey {
  if (duration === 3) return "package.months3";
  if (duration === 6) return "package.months6";
  return "package.months12";
}

export default function Step4Package({ data, errors, lang, onChange }: Step4PackageProps): ReactElement {
  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.4")}</h2>
      <p className="mt-2 text-sm text-muted">{t(lang, "package.heading")}</p>

      {/* The two plans. Each card has its own duration options. */}
      <div className="mt-5 space-y-4">
        {PLANS.map((plan) => {
          const isPlanSelected: boolean = data.planId === plan.id;

          return (
            <section
              key={plan.id}
              className={`rounded-card border p-5 transition ${
                isPlanSelected ? "border-primary bg-primary/5" : "border-line bg-card"
              }`}
            >
              <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                {t(lang, planNameKey(plan.id))}
                {plan.tagKeys.map((tagKey) => (
                  <span
                    key={tagKey}
                    className="rounded-pill bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-strong"
                  >
                    {t(lang, tagKey as TranslationKey)}
                  </span>
                ))}
                {isPlanSelected ? (
                  <span className="rounded-pill bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-strong">
                    {t(lang, "package.selected")}
                  </span>
                ) : null}
              </p>

              <p className="mt-4 text-xs font-semibold text-ink">{t(lang, "package.duration")}</p>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {DURATIONS.map((duration) => {
                  const isSelected: boolean = isPlanSelected && data.durationMonths === duration;
                  const price: number = getPlanPrice(plan, duration);

                  return (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => onChange({ planId: plan.id, durationMonths: duration })}
                      aria-pressed={isSelected}
                      className={`rounded-panel border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-line bg-soft/40 hover:border-primary/60"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink">
                        {t(lang, durationKey(duration))}
                      </span>
                      <span className="mt-1 block text-sm font-semibold tabular-nums text-primary-dark">
                        {formatNumber(lang, price)} {t(lang, "package.perEgp")}
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
                {plan.id === "growth" ? (
                  <li className="rounded-pill border border-line bg-soft/60 px-3 py-1 text-xs text-ink">
                    {t(lang, "package.feature.ai")}
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>

      {errors["planId"] !== undefined ? (
        <p role="alert" className="mt-4 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errors["planId"]}
        </p>
      ) : null}

      {errors["durationMonths"] !== undefined ? (
        <p role="alert" className="mt-4 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errors["durationMonths"]}
        </p>
      ) : null}
    </div>
  );
}
