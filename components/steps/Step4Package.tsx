// This file is step 4 "الباقة": the billing cycle (monthly or yearly) and the plan.

"use client";

import type { ReactElement } from "react";
import { FEATURES, PLANS, getPlanPrice } from "@/lib/constants";
import { formatNumber, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { BillingCycle, Lang, RegisterData, StepErrors } from "@/lib/types";

type Step4PackageProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  onChange: (patch: Partial<RegisterData>) => void;
};

const CYCLES: BillingCycle[] = ["monthly", "yearly"];

export default function Step4Package({ data, errors, lang, onChange }: Step4PackageProps): ReactElement {
  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.4")}</h2>
      <p className="mt-2 text-sm text-muted">{t(lang, "package.heading")}</p>

      {/* The billing cycle. It changes the price of every plan. */}
      <div className="mt-6 inline-flex rounded-panel border border-line bg-soft/40 p-1">
        {CYCLES.map((cycle) => {
          const isSelected: boolean = data.billingCycle === cycle;
          const labelKey: TranslationKey = cycle === "monthly" ? "package.monthly" : "package.yearly";

          return (
            <button
              key={cycle}
              type="button"
              onClick={() => onChange({ billingCycle: cycle })}
              aria-pressed={isSelected}
              className={`h-10 rounded-pill px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected ? "bg-primary-dark text-white" : "text-ink hover:bg-card"
              }`}
            >
              {t(lang, labelKey)}
            </button>
          );
        })}
      </div>

      {/* The plans. MOCK data for now, they will come from the backend later. */}
      <div className="mt-5 space-y-4">
        {PLANS.map((plan) => {
          const isSelected: boolean = data.planId === plan.id;
          const price: number = getPlanPrice(plan, data.billingCycle);
          const unitKey: TranslationKey =
            data.billingCycle === "monthly" ? "package.perMonth" : "package.perYear";

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange({ planId: plan.id })}
              aria-pressed={isSelected}
              className={`w-full rounded-card border p-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                isSelected ? "border-primary bg-primary/5" : "border-line bg-card hover:border-primary/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                    {plan.name[lang]}
                    {plan.tagKeys.map((tagKey) => (
                      <span
                        key={tagKey}
                        className="rounded-pill bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-strong"
                      >
                        {t(lang, tagKey as TranslationKey)}
                      </span>
                    ))}
                    {isSelected ? (
                      <span className="rounded-pill bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-strong">
                        {t(lang, "package.selected")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">{plan.description[lang]}</p>
                </div>

                <p className="shrink-0 text-end">
                  <span className="block text-xl font-semibold tabular-nums text-primary-dark">
                    {formatNumber(lang, price)}
                  </span>
                  <span className="block text-xs text-muted">{t(lang, unitKey)}</span>
                </p>
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
              </ul>
            </button>
          );
        })}
      </div>

      {errors["planId"] !== undefined ? (
        <p role="alert" className="mt-4 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errors["planId"]}
        </p>
      ) : null}
    </div>
  );
}
