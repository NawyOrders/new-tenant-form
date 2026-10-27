// This file is the heart of the app: it holds ALL the form state, the current step and the
// language. It renders the layout, the active step, the buttons and the live preview.

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import PhonePreview from "./preview/PhonePreview";
import StepIndicator from "./StepIndicator";
import Step1MainInfo from "./steps/Step1MainInfo";
import Step2Identity from "./steps/Step2Identity";
import Step3Branches from "./steps/Step3Branches";
import Step4Package from "./steps/Step4Package";
import TopBar from "./TopBar";
import Button from "./ui/Button";
import { STEP_ORDER, TOTAL_STEPS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";
import { getOffers } from "@/lib/api/offers";
import { submitRegistration } from "@/lib/submitRegistration";
import { validateStep, getFieldError } from "@/lib/validation";
import { getDevFixtures } from "@/lib/devFixtures";
import type {
  ActiveSubscriptionOffer,
  Lang,
  OffersStatus,
  RegisterData,
  StepErrors,
  SubmitResult,
} from "@/lib/types";

/** The form when the page opens. */
const INITIAL_DATA: RegisterData = {
  restaurantName: "",
  logoFile: null,
  menuFile: null,
  owner: { fullName: "", phone: "", email: "" },
  brand: { primaryColor: "", backgroundColor: "", accentColor: "" },
  branches: [],
  subscriptionOfferId: null,
};

function RegisterWizardInner(): ReactElement {
  const searchParams = useSearchParams();
  const initialState = useRef<{ data: RegisterData; step: number } | null>(null);

  if (initialState.current === null) {
    let nextData: RegisterData = { ...INITIAL_DATA };
    let nextStep = 1;

    if (process.env.NODE_ENV === "development") {
      const stepParam = searchParams.get("step");
      if (stepParam && STEP_ORDER.includes(stepParam)) {
        const idx = STEP_ORDER.indexOf(stepParam);
        if (idx >= 0) {
          nextStep = idx + 1;
        }
      }

      const demoParam = searchParams.get("demo");
      if (demoParam === "1") {
        const fixtures = getDevFixtures();
        nextData = { ...nextData, ...fixtures };
      }
    }

    initialState.current = { data: nextData, step: nextStep };
  }

  const [data, setData] = useState<RegisterData>(initialState.current.data);
  const [lang, setLang] = useState<Lang>("ar");
  const [currentStep, setCurrentStep] = useState<number>(initialState.current.step);
  const [errors, setErrors] = useState<StepErrors>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string>("");

  // The offers are loaded when step 4 opens. A failure only affects that step.
  const [offers, setOffers] = useState<ActiveSubscriptionOffer[]>([]);
  const [offersStatus, setOffersStatus] = useState<OffersStatus>("idle");
  const [offersErrorKey, setOffersErrorKey] = useState<TranslationKey>("package.loadFailed");
  const offersLoadingRef = useRef<boolean>(false);

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
  function handleChange(patch: Partial<RegisterData> | ((prev: RegisterData) => Partial<RegisterData>)): void {
    setData((prev) => {
      const nextPatch = typeof patch === "function" ? patch(prev) : patch;
      const next = { ...prev, ...nextPatch };

      if (nextPatch.logoFile !== undefined && nextPatch.logoFile !== prev.logoFile) {
        const url: string | null = createLocalUrl(nextPatch.logoFile, logoUrlRef.current);
        logoUrlRef.current = url;
        setLogoUrl(url);
      }

      if (nextPatch.menuFile !== undefined && nextPatch.menuFile !== prev.menuFile) {
        const url: string | null = createLocalUrl(nextPatch.menuFile, menuUrlRef.current);
        menuUrlRef.current = url;
        setMenuUrl(url);
      }

      // The errors only show after the visitor tried to go to the next step.
      if (Object.keys(errors).length > 0) {
        setErrors(validateStep(currentStep, next, lang));
      }

      return next;
    });
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

  function getCurrentStepKey(): string {
    return STEP_ORDER[currentStep - 1] ?? STEP_ORDER[0];
  }

  /** Changes the language. The data of the form is never lost. */
  function handleToggleLang(): void {
    const nextLang: Lang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);

    if (Object.keys(errors).length > 0) {
      setErrors(validateStep(currentStep, data, nextLang));
    }
  }

  /** Shows the error of one field as soon as the visitor leaves it. */
  function handleFieldBlur(field: string): void {
    const message: string = getFieldError(field, data, lang);

    setErrors((prev) => {
      const next: StepErrors = { ...prev };

      if (message === "") {
        delete next[field];
      } else {
        next[field] = message;
      }

      return next;
    });
  }

  /** Loads the subscription offers. Only step 4 shows the result. */
  async function handleLoadOffers(): Promise<void> {
    if (offersLoadingRef.current) {
      return;
    }

    offersLoadingRef.current = true;
    setOffersStatus("loading");

    try {
      const loaded: ActiveSubscriptionOffer[] = await getOffers();
      setOffers(loaded);
      setOffersStatus("ready");
    } catch (error) {
      setOffers([]);
      setOffersErrorKey(
        error instanceof ApiError && error.kind === "missing_config"
          ? "error.apiMissingConfig"
          : "package.loadFailed",
      );
      setOffersStatus("failed");
    } finally {
      offersLoadingRef.current = false;
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
  const selectedOffer: ActiveSubscriptionOffer | null =
    offers.find((offer) => offer.id === data.subscriptionOfferId) ?? null;

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-[1100] border-b border-line bg-card">
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

                {(() => {
                  const key = getCurrentStepKey();
                  if (key === "main") {
                    return (
                      <Step1MainInfo
                        data={data}
                        errors={errors}
                        lang={lang}
                        logoUrl={logoUrl}
                        menuUrl={menuUrl}
                        onChange={handleChange}
                        onBlurField={handleFieldBlur}
                      />
                    );
                  }
                  if (key === "identity") {
                    return (
                      <Step2Identity
                        data={data}
                        errors={errors}
                        lang={lang}
                        logoUrl={logoUrl}
                        onChange={handleChange}
                        onEditLogo={() => {
                          const idx = STEP_ORDER.indexOf("main");
                          goToStep(idx >= 0 ? idx + 1 : 1);
                        }}
                      />
                    );
                  }
                  if (key === "branches") {
                    return <Step3Branches data={data} errors={errors} lang={lang} onChange={handleChange} onBlurField={handleFieldBlur} />;
                  }
                  if (key === "package") {
                    return (
                      <Step4Package
                        data={data}
                        errors={errors}
                        lang={lang}
                        onChange={handleChange}
                        offers={offers}
                        status={offersStatus}
                        errorKey={offersErrorKey}
                        onLoadOffers={() => void handleLoadOffers()}
                      />
                    );
                  }
                  return null;
                })()}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
                  {currentStep > 1 ? (
                    <Button variant="secondary" onClick={() => goToStep(currentStep - 1)}>
                      {t(lang, "btn.back")}
                    </Button>
                  ) : (
                    <span />
                  )}

                  {(() => {
                    const key = getCurrentStepKey();
                    const isLast = STEP_ORDER[STEP_ORDER.length - 1] === key;
                    if (!isLast) {
                      return <Button onClick={handleNext}>{t(lang, "btn.next")}</Button>;
                    }
                    return (
                      // TODO: enable after the backend confirms submit is live.
                      <Button disabled isLoading={isSubmitting} onClick={() => void handleSubmit()}>
                        {t(lang, "btn.finish")}
                      </Button>
                    );
                  })()}
                </div>
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-36">
            <p className="mb-3 text-center text-xs text-muted">{t(lang, "preview.hint")}</p>
            <PhonePreview
              data={data}
              lang={lang}
              logoUrl={logoUrl}
              menuUrl={menuUrl}
              selectedOffer={selectedOffer}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function RegisterWizard(): ReactElement {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <RegisterWizardInner />
    </Suspense>
  );
}
