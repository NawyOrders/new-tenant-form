// This component renders the payment step (last step).
"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Button from "../ui/Button";
import { PLANS, getPlanPrice } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { validateStep1, validateStep2, validateStep3, validateStep4 } from "@/lib/validation";
import type { Lang, RegisterData, StepErrors } from "@/lib/types";

type StepPaymentProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  onChange: (patch: Partial<RegisterData>) => void;
};

export default function StepPayment({ data, lang }: StepPaymentProps): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const plan = PLANS.find((p) => p.id === data.planId) ?? null;
  const amount = plan ? getPlanPrice(plan, data.billingCycle) : null;

  const step1Errors = validateStep1(data, lang);
  const step2Errors = validateStep2(data, lang);
  const step3Errors = validateStep3(data, lang);
  const step4Errors = validateStep4(data, lang);
  const earlierIncomplete =
    Object.keys(step1Errors).length > 0 ||
    Object.keys(step2Errors).length > 0 ||
    Object.keys(step3Errors).length > 0 ||
    Object.keys(step4Errors).length > 0;

  async function handlePay(): Promise<void> {
    setErrorMsg("");
    if (plan === null || amount === null) {
      setErrorMsg(t(lang, "payment.choosePlanFirst"));
      return;
    }
    if (earlierIncomplete) {
      setErrorMsg(t(lang, "payment.completeFirst"));
      return;
    }

    setIsLoading(true);
    try {
      const merchantOrderId = `NAWY-${Date.now()}`;
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: data.planId,
          billingCycle: data.billingCycle,
          ownerName: data.owner.fullName,
          email: data.owner.email,
          phone: data.owner.phone,
          merchantOrderId,
        }),
      });
      const json = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok) {
        setErrorMsg(json.error ?? t(lang, "error.submit"));
        setIsLoading(false);
        return;
      }
      if (json.checkoutUrl !== undefined && json.checkoutUrl !== "") {
        window.location.href = json.checkoutUrl;
        return;
      }
      setErrorMsg(t(lang, "error.submit"));
      setIsLoading(false);
    } catch {
      setErrorMsg(t(lang, "error.submit"));
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">{t(lang, "payment.summary")}</h2>
        <div className="mt-4 rounded-panel border border-line bg-soft/50 p-4 space-y-2">
          {plan === null ? (
            <p className="text-sm text-danger-strong">{t(lang, "payment.choosePlanFirst")}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t(lang, "preview.plan")}</span>
                <span className="text-sm font-semibold text-ink">
                  {lang === "ar" ? plan.name.ar : plan.name.en}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t(lang, "payment.amount")}</span>
                <span className="text-sm font-semibold text-ink">
                  {amount} {lang === "ar" ? "ج.م" : "EGP"} /{" "}
                  {data.billingCycle === "yearly" ? t(lang, "package.yearly") : t(lang, "package.monthly")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {errorMsg !== "" ? (
        <p role="alert" className="rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errorMsg}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
        <span />
        <Button onClick={() => void handlePay()} isLoading={isLoading} disabled={plan === null || earlierIncomplete}>
          {t(lang, "payment.payNow")}
        </Button>
      </div>
      {earlierIncomplete && plan !== null ? (
        <p className="text-xs text-muted">{t(lang, "payment.completeFirst")}</p>
      ) : null}
      {isLoading ? <p className="text-xs text-muted">{t(lang, "payment.redirecting")}</p> : null}
    </div>
  );
}
