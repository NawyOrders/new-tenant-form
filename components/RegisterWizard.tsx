// This file is the heart of the app: it holds ALL the form state, the current step and the
// language. It renders the layout, the active step, the buttons and the live preview.

"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import PhonePreview from "./preview/PhonePreview";
import StepIndicator from "./StepIndicator";
import Step1MainInfo from "./steps/Step1MainInfo";
import Step2Identity from "./steps/Step2Identity";
import Step3Branches from "./steps/Step3Branches";
import Step4Package from "./steps/Step4Package";
import TopBar from "./TopBar";
import Button from "./ui/Button";
import { TOTAL_STEPS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { submitRegistration } from "@/lib/submitRegistration";
import { validateStep } from "@/lib/validation";
import type { Lang, RegisterData, StepErrors, SubmitResult } from "@/lib/types";

/** The form when the page opens. */
const INITIAL_DATA: RegisterData = {
  restaurantName: "",
  logoFile: null,
  menuFile: null,
  owner: { fullName: "", phone: "", email: "" },
  brand: { primaryColor: "", backgroundColor: "", accentColor: "" },
  branches: [],
  planId: null,
  billingCycle: "monthly",
};

export default function RegisterWizard(): ReactElement {
  const [data, setData] = useState<RegisterData>(INITIAL_DATA);
  const [lang, setLang] = useState<Lang>("ar");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string>("");

  // The logo and the menu are kept in the browser only. The picture of the file is a local
  // address, and the old one is freed as soon as the file changes.
  const logoUrlRef = useRef<string | null>(null);
  const menuUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoUrlRef.current !== null) {
        URL.revokeObjectURL(logoUrlRef.current);
      }

      if (menuUrlRef.current !== null) {
        URL.revokeObjectURL(menuUrlRef.current);
      }
    };
  }, []);

  // The language of the page follows the language of the form.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  /** Makes a new local address for a file and frees the old one. */
  function createLocalUrl(file: File | null, currentUrl: string | null): string | null {
    if (currentUrl !== null) {
      URL.revokeObjectURL(currentUrl);
    }

    return file === null ? null : URL.createObjectURL(file);
  }

  /** The ONE change callback given to every step. */
  function handleChange(patch: Partial<RegisterData>): void {
    setData((prev) => ({ ...prev, ...patch }));

    if (patch.logoFile !== undefined && patch.logoFile !== data.logoFile) {
      const url: string | null = createLocalUrl(patch.logoFile, logoUrlRef.current);
      logoUrlRef.current = url;
      setLogoUrl(url);
    }

    if (patch.menuFile !== undefined && patch.menuFile !== data.menuFile) {
      const url: string | null = createLocalUrl(patch.menuFile, menuUrlRef.current);
      menuUrlRef.current = url;
      setMenuUrl(url);
    }

    // The errors only show after the visitor tried to go to the next step.
    if (Object.keys(errors).length > 0) {
      setErrors(validateStep(currentStep, data, lang));
    }
  }

  function scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Jumps to a step and forgets the old errors. */
  function goToStep(step: number): void {
    setErrors({});
    setCurrentStep(step);
    scrollToTop();
  }

  /** Changes the language. The data of the form is never lost. */
  function handleToggleLang(): void {
    const nextLang: Lang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);

    if (Object.keys(errors).length > 0) {
      setErrors(validateStep(currentStep, data, nextLang));
    }
  }

  /** Checks the step and moves to the next one when everything is fine. */
  function handleNext(): void {
    const stepErrors: StepErrors = validateStep(currentStep, data, lang);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
    }
  }

  /** Sends the registration. The values stay in the form when it fails. */
  async function handleSubmit(): Promise<void> {
    const stepErrors: StepErrors = validateStep(currentStep, data, lang);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      setResult(await submitRegistration(data));
    } catch {
      setSubmitError(t(lang, "error.submit"));
    } finally {
      setIsSubmitting(false);
      scrollToTop();
    }
  }

  /** Starts again with an empty form. */
  function handleRestart(): void {
    if (logoUrlRef.current !== null) {
      URL.revokeObjectURL(logoUrlRef.current);
    }

    if (menuUrlRef.current !== null) {
      URL.revokeObjectURL(menuUrlRef.current);
    }

    logoUrlRef.current = null;
    menuUrlRef.current = null;
    setLogoUrl(null);
    setMenuUrl(null);
    setData(INITIAL_DATA);
    setErrors({});
    setResult(null);
    setSubmitError("");
    setCurrentStep(1);
  }

  const hasErrors: boolean = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <TopBar lang={lang} onToggleLang={handleToggleLang} />
          <StepIndicator currentStep={currentStep} lang={lang} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* The form is the first column: in Arabic it is on the right, in English on the left. */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="rounded-card border border-line bg-card p-6 shadow-card">
            {result !== null ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success-strong">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                <h2 className="mt-5 text-xl font-semibold text-ink">{t(lang, "success.title")}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {t(lang, "success.body", { name: data.restaurantName })}
                </p>

                <div className="mx-auto mt-5 max-w-xs rounded-panel border border-line bg-soft/50 px-4 py-3">
                  <p className="text-xs text-muted">{t(lang, "success.reference")}</p>
                  <p className="mt-1 font-semibold tabular-nums text-primary-dark" dir="ltr">
                    {result.referenceId}
                  </p>
                </div>

                <p className="mx-auto mt-5 max-w-md rounded-panel bg-info-soft px-4 py-3 text-xs leading-relaxed text-info-strong">
                  {t(lang, "success.mock")}
                </p>

                <Button variant="secondary" className="mt-6" onClick={handleRestart}>
                  {t(lang, "success.restart")}
                </Button>
              </div>
            ) : (
              <>
                {hasErrors ? (
                  <p
                    role="alert"
                    className="mb-5 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong"
                  >
                    {t(lang, "form.errorSummary")}
                  </p>
                ) : null}

                {submitError !== "" ? (
                  <p
                    role="alert"
                    className="mb-5 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong"
                  >
                    {submitError}
                  </p>
                ) : null}

                {currentStep === 1 ? (
                  <Step1MainInfo
                    data={data}
                    errors={errors}
                    lang={lang}
                    logoUrl={logoUrl}
                    menuUrl={menuUrl}
                    onChange={handleChange}
                  />
                ) : null}

                {currentStep === 2 ? (
                  <Step2Identity
                    data={data}
                    errors={errors}
                    lang={lang}
                    logoUrl={logoUrl}
                    onChange={handleChange}
                    onEditLogo={() => goToStep(1)}
                  />
                ) : null}

                {currentStep === 3 ? (
                  <Step3Branches data={data} errors={errors} lang={lang} onChange={handleChange} />
                ) : null}

                {currentStep === 4 ? (
                  <Step4Package data={data} errors={errors} lang={lang} onChange={handleChange} />
                ) : null}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
                  {currentStep > 1 ? (
                    <Button variant="secondary" onClick={() => goToStep(currentStep - 1)}>
                      {t(lang, "btn.back")}
                    </Button>
                  ) : (
                    <span />
                  )}

                  {currentStep < TOTAL_STEPS ? (
                    <Button onClick={handleNext}>{t(lang, "btn.next")}</Button>
                  ) : (
                    <Button isLoading={isSubmitting} onClick={() => void handleSubmit()}>
                      {t(lang, "btn.finish")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-36">
            <p className="mb-3 text-center text-xs text-muted">{t(lang, "preview.hint")}</p>
            <PhonePreview data={data} lang={lang} logoUrl={logoUrl} menuUrl={menuUrl} />
          </aside>
        </div>
      </main>
    </div>
  );
}
