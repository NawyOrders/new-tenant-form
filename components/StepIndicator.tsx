// This file shows the step counter ("الخطوة 1 من 4") and the four progress bars.

import type { ReactElement } from "react";
import { STEPS, TOTAL_STEPS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type StepIndicatorProps = {
  /** The step the visitor is on right now (1 to 4). */
  currentStep: number;
  lang: Lang;
};

export default function StepIndicator({ currentStep, lang }: StepIndicatorProps): ReactElement {
  const titleKey: TranslationKey = `step.${currentStep}` as TranslationKey;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {t(lang, "step.counter", { current: currentStep, total: TOTAL_STEPS })}
        </p>
        <p className="truncate text-sm text-muted">{t(lang, titleKey)}</p>
      </div>

      <div className="mt-2 flex gap-2">
        {STEPS.map((step) => (
          <span
            key={step.id}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-pill transition-colors ${
              step.id <= currentStep ? "bg-primary" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
