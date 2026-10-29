// This file is the heart of the app: it holds ALL the form state, the current step and the
// language. It renders the layout, the active step, the buttons and the live preview.

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { submitOnboardingRequest } from "@/lib/api/onboarding";
import { mapServerErrors } from "@/lib/api/serverErrors";
import type { GeneralServerError } from "@/lib/api/serverErrors";
import {
  LogoUploadError,
  UPLOAD_TYPE_MENU,
  UploadTooLargeError,
  confirmAsset,
  createUploadUrls,
  isUploadUrlExpired,
  uploadFile,
  uploadLogo,
} from "@/lib/api/uploads";
import type { UploadUrlItem } from "@/lib/api/types";
import { validateStep, getFieldError } from "@/lib/validation";
import { getDevFixtures } from "@/lib/devFixtures";
import type {
  ActiveSubscriptionOffer,
  Lang,
  OffersStatus,
  RegisterData,
  StepErrors,
  SubmitResult,
  UploadErrorKey,
  UploadState,
} from "@/lib/types";

/** The form when the page opens. */
const INITIAL_DATA: RegisterData = {
  restaurantNameAr: "",
  restaurantNameEn: "",
  logoFile: null,
  menuFile: null,
  logoAssetId: null,
  menuAssetId: null,
  owner: { fullName: "", phone: "", email: "" },
  brand: { primaryColor: "", backgroundColor: "", accentColor: "" },
  branches: [],
  subscriptionOfferId: null,
};

/** The upload state before any file is chosen. */
const EMPTY_UPLOAD_STATE: UploadState = { status: "idle", errorKey: null };

/** The three steps of one upload, in order. */
type UploadStage = "uploadUrls" | "put" | "confirm";

/** What one failed upload keeps, so the retry can resume at the step that failed. */
type PendingUpload = {
  file: File;
  item: UploadUrlItem | null;
  stage: UploadStage;
};

/** The message of each failed step of the menu upload. */
const STAGE_ERROR_KEYS: Record<UploadStage, UploadErrorKey> = {
  uploadUrls: "upload.step.urls",
  put: "upload.step.put",
  confirm: "upload.step.confirm",
};

function RegisterWizardInner(): ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [submitGeneralErrors, setSubmitGeneralErrors] = useState<GeneralServerError[]>([]);

  // The state of the two uploads. The files stay in the form when an upload fails.
  const [logoUpload, setLogoUpload] = useState<UploadState>(EMPTY_UPLOAD_STATE);
  const [menuUpload, setMenuUpload] = useState<UploadState>(EMPTY_UPLOAD_STATE);
  const logoUploadSeq = useRef<number>(0);
  const menuUploadSeq = useRef<number>(0);
  // The failed menu upload, kept so the retry resumes at the failed step.
  const menuPendingRef = useRef<PendingUpload | null>(null);
  // One key per submit attempt: a retry after a network error reuses it.
  const idempotencyKeyRef = useRef<string | null>(null);
  const submittingRef = useRef<boolean>(false);

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

  /** Asks for one menu upload slot and checks it against the chosen file. */
  async function requestMenuSlot(file: File): Promise<UploadUrlItem> {
    const items: UploadUrlItem[] = await createUploadUrls([
      {
        type: UPLOAD_TYPE_MENU,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      },
    ]);
    const item: UploadUrlItem | undefined = items[0];

    if (item === undefined) {
      throw new ApiError("server", "upload-urls returned no upload slot");
    }

    if (file.size > item.maximumSizeBytes) {
      throw new UploadTooLargeError();
    }

    // The storage signs this header, so a different browser type must stop the upload here.
    if (file.type !== "" && file.type !== item.contentType) {
      throw new ApiError("server", `The file is ${file.type} but the upload URL signs ${item.contentType}`);
    }

    return item;
  }

  /** Turns the step of the shared logo upload into the message the form shows. */
  function logoErrorKey(error: unknown): UploadErrorKey {
    if (error instanceof LogoUploadError) {
      if (error.reason === "tooLarge") return "upload.tooLarge";
      if (error.reason === "missingConfig") return "error.apiMissingConfig";
      if (error.stage === "urls") return "upload.step.urls";
      if (error.stage === "put") return "upload.step.put";
    }

    return "upload.step.confirm";
  }

  /** Uploads the logo through the shared helper of step 1 and step 2. */
  async function runLogoUpload(file: File): Promise<void> {
    logoUploadSeq.current += 1;
    const seq: number = logoUploadSeq.current;
    setLogoUpload({ status: "uploading", errorKey: null });
    handleChange({ logoAssetId: null });

    try {
      const asset = await uploadLogo(file);

      if (seq !== logoUploadSeq.current) {
        return;
      }

      handleChange({ logoAssetId: asset.assetId });
      setLogoUpload({ status: "done", errorKey: null });
    } catch (error) {
      if (seq !== logoUploadSeq.current) {
        return;
      }

      setLogoUpload({ status: "failed", errorKey: logoErrorKey(error) });
    }
  }

  /**
   * Uploads the menu, or resumes it at the failed step. The upload URL is only requested
   * again when there is no slot or the slot is past expiresAtUtc.
   */
  async function runMenuUpload(file: File, resumeStage: UploadStage | null): Promise<void> {
    menuUploadSeq.current += 1;
    const seq: number = menuUploadSeq.current;
    setMenuUpload({ status: "uploading", errorKey: null });

    const pending: PendingUpload | null = menuPendingRef.current;
    let stage: UploadStage = resumeStage ?? "uploadUrls";
    let slot: UploadUrlItem | null = pending !== null && pending.file === file ? pending.item : null;

    if (slot !== null && isUploadUrlExpired(slot)) {
      slot = null;
    }

    try {
      if (slot === null) {
        stage = "uploadUrls";
        slot = await requestMenuSlot(file);
        stage = "put";
      } else if (stage === "uploadUrls") {
        stage = "put";
      }

      if (stage === "put") {
        await uploadFile(slot.uploadUrl, file, slot.contentType);
        stage = "confirm";
      }

      await confirmAsset(slot.assetId);

      // The file was removed or replaced while the upload was running.
      if (seq !== menuUploadSeq.current) {
        return;
      }

      menuPendingRef.current = null;
      handleChange({ menuAssetId: slot.assetId });
      setMenuUpload({ status: "done", errorKey: null });
    } catch (error) {
      if (seq !== menuUploadSeq.current) {
        return;
      }

      if (error instanceof UploadTooLargeError) {
        menuPendingRef.current = null;
        handleChange({ menuAssetId: null });
        setMenuUpload({ status: "failed", errorKey: "upload.tooLarge" });
        return;
      }

      const errorKey: UploadErrorKey =
        error instanceof ApiError && error.kind === "missing_config"
          ? "error.apiMissingConfig"
          : STAGE_ERROR_KEYS[stage];

      menuPendingRef.current = { file, item: slot, stage };
      handleChange({ menuAssetId: null });
      setMenuUpload({ status: "failed", errorKey });
    }
  }

  /** Keeps the logo, clears its old asset, and starts the shared upload. */
  function handleSelectLogo(file: File | null): void {
    logoUploadSeq.current += 1;
    handleChange({ logoFile: file, logoAssetId: null });
    setLogoUpload(EMPTY_UPLOAD_STATE);

    if (file !== null) {
      void runLogoUpload(file);
    }
  }

  /** Keeps the menu, clears its old asset, and starts a new upload. */
  function handleSelectMenu(file: File | null): void {
    menuUploadSeq.current += 1;
    menuPendingRef.current = null;
    handleChange({ menuFile: file, menuAssetId: null });
    setMenuUpload(EMPTY_UPLOAD_STATE);

    if (file !== null) {
      void runMenuUpload(file, null);
    }
  }

  /** Uploads the same logo again. The file is never lost. */
  function handleRetryLogo(): void {
    const file: File | null = data.logoFile;

    if (file !== null) {
      void runLogoUpload(file);
    }
  }

  /** Uploads the same menu again from the step that failed. The file is never lost. */
  function handleRetryMenu(): void {
    const file: File | null = data.menuFile;

    if (file !== null) {
      const pending: PendingUpload | null = menuPendingRef.current;
      void runMenuUpload(file, pending !== null && pending.file === file ? pending.stage : null);
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

  /** The step that owns one field, used when the backend rejects a field. */
  function stepOfField(field: string): number {
    if (field.startsWith("branches")) return STEP_ORDER.indexOf("branches") + 1;
    if (field.startsWith("brand.")) return STEP_ORDER.indexOf("identity") + 1;
    if (field === "subscriptionOfferId") return STEP_ORDER.indexOf("package") + 1;
    return 1;
  }

  /** Sends the registration. The values stay in the form when it fails. */
  async function handleSubmit(): Promise<void> {
    if (submittingRef.current) {
      return;
    }

    // Every step must be valid before anything is sent.
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      const stepErrors: StepErrors = validateStep(step, data, lang);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setCurrentStep(step);
        scrollToTop();
        return;
      }
    }

    // The request carries the asset ids, so the two files must be confirmed first.
    if (data.logoAssetId === null || data.menuAssetId === null) {
      const isUploading: boolean = logoUpload.status === "uploading" || menuUpload.status === "uploading";
      setSubmitError(t(lang, isUploading ? "upload.uploading" : "upload.failed"));
      setErrors({});
      setCurrentStep(1);
      scrollToTop();
      return;
    }

    if (idempotencyKeyRef.current === null) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitGeneralErrors([]);

    try {
      const submitResult: SubmitResult = await submitOnboardingRequest(data, idempotencyKeyRef.current);
      idempotencyKeyRef.current = null;
      setResult(submitResult);
      clearForm();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitError(t(lang, "submit.duplicate"));
      } else if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
        // The backend validates stricter than its schema, so its errors are mapped to the form.
        const mapped = mapServerErrors(error.errors);
        const fields: string[] = Object.keys(mapped.fields);

        setSubmitGeneralErrors(mapped.general);

        if (fields.length > 0) {
          setErrors(mapped.fields);
          setCurrentStep(Math.min(...fields.map(stepOfField)));
        } else if (mapped.general.length === 0) {
          setErrors({});
          setSubmitError(t(lang, "error.submit"));
        } else {
          setErrors({});
        }
      } else {
        setSubmitError(t(lang, "error.submit"));
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      scrollToTop();
    }
  }

  /** Empties the form. The request id stays on the success screen. */
  function clearForm(): void {
    if (logoUrlRef.current !== null) {
      URL.revokeObjectURL(logoUrlRef.current);
    }

    if (menuUrlRef.current !== null) {
      URL.revokeObjectURL(menuUrlRef.current);
    }

    logoUrlRef.current = null;
    menuUrlRef.current = null;
    logoUploadSeq.current += 1;
    menuUploadSeq.current += 1;
    setLogoUrl(null);
    setMenuUrl(null);
    setLogoUpload(EMPTY_UPLOAD_STATE);
    setMenuUpload(EMPTY_UPLOAD_STATE);
    setData(INITIAL_DATA);
    setErrors({});
    setSubmitError("");
    setSubmitGeneralErrors([]);
    setCurrentStep(1);
  }

  /** Goes back to the home page from the success screen. */
  function handleGoHome(): void {
    router.push("/");
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

                <h2 className="mt-5 text-xl font-semibold text-ink">{t(lang, "submit.success.title")}</h2>

                <div className="mx-auto mt-5 max-w-sm rounded-panel border border-line bg-soft/50 px-4 py-3">
                  <label htmlFor="request-id" className="text-xs text-muted">
                    {t(lang, "submit.success.requestId")}
                  </label>
                  <input
                    id="request-id"
                    readOnly
                    dir="ltr"
                    value={result.requestId}
                    onFocus={(event) => event.target.select()}
                    className="mt-1 w-full select-all rounded-panel border border-line bg-card px-3 py-2 text-center font-semibold tabular-nums text-primary-dark outline-none"
                  />
                </div>

                <Button className="mt-6" onClick={handleGoHome}>
                  {t(lang, "submit.success.home")}
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

                {submitGeneralErrors.length > 0 ? (
                  <div
                    role="alert"
                    className="mb-5 rounded-panel bg-danger-soft px-4 py-3 text-sm text-danger-strong"
                  >
                    <p className="font-semibold">{t(lang, "submit.error.general")}</p>
                    <ul className="mt-2 space-y-1">
                      {submitGeneralErrors.map((entry) => (
                        <li key={entry.field}>
                          <span dir="ltr" className="font-mono text-xs">{entry.field}</span>
                          {`: ${entry.message}`}
                        </li>
                      ))}
                    </ul>
                  </div>
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
                        logoUpload={logoUpload}
                        menuUpload={menuUpload}
                        onChange={handleChange}
                        onBlurField={handleFieldBlur}
                        onSelectLogo={handleSelectLogo}
                        onSelectMenu={handleSelectMenu}
                        onRetryLogo={handleRetryLogo}
                        onRetryMenu={handleRetryMenu}
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
                        onBlurField={handleFieldBlur}
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
                      <Button isLoading={isSubmitting} onClick={() => void handleSubmit()}>
                        {isSubmitting ? t(lang, "submit.loading") : t(lang, "btn.finish")}
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
