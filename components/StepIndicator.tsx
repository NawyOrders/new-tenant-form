// This file shows the step counter ("الخطوة 1 من 4") and the progress bars.

import type { ReactElement } from "react";
import { STEP_ORDER, TOTAL_STEPS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type StepIndicatorProps = {
  /** The step the visitor is on right now (1-based). */
  currentStep: number;
  lang: Lang;
};

export default function StepIndicator({ currentStep, lang }: StepIndicatorProps): ReactElement {
  const stepKey = STEP_ORDER[currentStep - 1] ?? STEP_ORDER[0];
  const titleKey: TranslationKey = (`step.${stepKey}` as TranslationKey);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {t(lang, "step.counter", { current: currentStep, total: TOTAL_STEPS })}
        </p>
        <p className="truncate text-sm text-muted">{t(lang, titleKey)}</p>
      </div>

      <div className="mt-2 flex gap-2">
        {STEP_ORDER.map((key, index) => (
          <span
            key={key}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-pill transition-colors ${
              index + 1 <= currentStep ? "bg-primary" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
