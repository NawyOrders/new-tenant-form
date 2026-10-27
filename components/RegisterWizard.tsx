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
import { mapServerFieldErrors, submitOnboardingRequest } from "@/lib/api/onboarding";
import { getLogoPalette } from "@/lib/api/palette";
import {
  UPLOAD_TYPE_LOGO,
  UPLOAD_TYPE_MENU,
  UploadTooLargeError,
  confirmAsset,
  createUploadUrls,
  isUploadUrlExpired,
  uploadFile,
} from "@/lib/api/uploads";
import type { UploadUrlItem } from "@/lib/api/types";
import { validateStep, getFieldError } from "@/lib/validation";
import { getDevFixtures } from "@/lib/devFixtures";
import type {
  ActiveSubscriptionOffer,
  Lang,
  OffersStatus,
  PaletteErrorKey,
  PaletteState,
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
  logoUploadToken: null,
  menuAssetId: null,
  menuUploadToken: null,
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

/** The message of each failed step of the upload. */
const STAGE_ERROR_KEYS: Record<UploadStage, UploadErrorKey> = {
  uploadUrls: "upload.step.urls",
  put: "upload.step.put",
  confirm: "upload.step.confirm",
};

/** The palette state before a logo is chosen. */
const EMPTY_PALETTE_STATE: PaletteState = {
  status: "idle",
  options: [],
  warnings: [],
  contrastRatio: null,
  isWcagCompliant: true,
  errorKey: null,
  canRetry: false,
};

/** How long the visitor waits before the retry of a rate-limited palette request appears. */
const PALETTE_RETRY_WAIT_MS = 5_000;

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

  // The state of the two uploads. The files stay in the form when an upload fails.
  const [logoUpload, setLogoUpload] = useState<UploadState>(EMPTY_UPLOAD_STATE);
  const [menuUpload, setMenuUpload] = useState<UploadState>(EMPTY_UPLOAD_STATE);
  const logoUploadSeq = useRef<number>(0);
  const menuUploadSeq = useRef<number>(0);
  // The failed upload of each file, kept so the retry resumes at the failed step.
  const logoPendingRef = useRef<PendingUpload | null>(null);
  const menuPendingRef = useRef<PendingUpload | null>(null);
  // The color suggestions of the logo. They are UI state, not part of the form data.
  const [palette, setPalette] = useState<PaletteState>(EMPTY_PALETTE_STATE);
  const paletteSeq = useRef<number>(0);
  const paletteRetryTimer = useRef<number | null>(null);
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

      if (paletteRetryTimer.current !== null) {
        window.clearTimeout(paletteRetryTimer.current);
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

  /** Asks for one upload slot and checks it against the chosen file. */
  async function requestUploadSlot(kind: "logo" | "menu", file: File): Promise<UploadUrlItem> {
    const items: UploadUrlItem[] = await createUploadUrls([
      {
        type: kind === "logo" ? UPLOAD_TYPE_LOGO : UPLOAD_TYPE_MENU,
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

  /**
   * Uploads one file, or resumes it at the failed step. The upload URL is only requested
   * again when there is no slot or the slot is past expiresAtUtc.
   */
  async function runUpload(kind: "logo" | "menu", file: File, resumeStage: UploadStage | null): Promise<void> {
    const seqRef: { current: number } = kind === "logo" ? logoUploadSeq : menuUploadSeq;
    const pendingRef: { current: PendingUpload | null } = kind === "logo" ? logoPendingRef : menuPendingRef;
    const setUploadState = kind === "logo" ? setLogoUpload : setMenuUpload;
    const assetPatch = (assetId: string | null, uploadToken: string | null): Partial<RegisterData> =>
      kind === "logo" ? { logoAssetId: assetId, logoUploadToken: uploadToken } : { menuAssetId: assetId, menuUploadToken: uploadToken };

    seqRef.current += 1;
    const seq: number = seqRef.current;
    setUploadState({ status: "uploading", errorKey: null });

    const pending: PendingUpload | null = pendingRef.current;
    const resumeAt: UploadStage = resumeStage ?? "uploadUrls";
    let stage: UploadStage = resumeAt;
    let slot: UploadUrlItem | null = pending !== null && pending.file === file ? pending.item : null;

    if (slot !== null && isUploadUrlExpired(slot)) {
      slot = null;
    }

    try {
      if (slot === null) {
        stage = "uploadUrls";
        slot = await requestUploadSlot(kind, file);
        stage = "put";
      } else if (stage === "uploadUrls") {
        stage = "put";
      }

      if (stage === "put") {
        await uploadFile(slot.uploadUrl, file, slot.contentType);
        stage = "confirm";
      }

      await confirmAsset(slot.assetId, slot.uploadToken);

      // The file was removed or replaced while the upload was running.
      if (seq !== seqRef.current) {
        return;
      }

      pendingRef.current = null;
      handleChange(assetPatch(slot.assetId, slot.uploadToken));
      setUploadState({ status: "done", errorKey: null });
    } catch (error) {
      if (seq !== seqRef.current) {
        return;
      }

      if (error instanceof UploadTooLargeError) {
        pendingRef.current = null;
        handleChange(assetPatch(null, null));
        setUploadState({ status: "failed", errorKey: "upload.tooLarge" });
        return;
      }

      const errorKey: UploadErrorKey =
        error instanceof ApiError && error.kind === "missing_config"
          ? "error.apiMissingConfig"
          : STAGE_ERROR_KEYS[stage];

      pendingRef.current = { file, item: slot, stage };
      handleChange(assetPatch(null, null));
      setUploadState({ status: "failed", errorKey });
    }
  }

  /** Stops the timer that enables the retry of a rate-limited palette request. */
  function clearPaletteRetryTimer(): void {
    if (paletteRetryTimer.current !== null) {
      window.clearTimeout(paletteRetryTimer.current);
      paletteRetryTimer.current = null;
    }
  }

  /** Asks the backend for the colors of one logo file. It runs beside the upload. */
  async function loadLogoPalette(file: File): Promise<void> {
    clearPaletteRetryTimer();
    paletteSeq.current += 1;
    const seq: number = paletteSeq.current;
    setPalette({ ...EMPTY_PALETTE_STATE, status: "loading" });

    try {
      const result = await getLogoPalette(file);

      if (seq !== paletteSeq.current) {
        return;
      }

      setPalette({
        status: "ready",
        options: result.options,
        warnings: result.warnings,
        contrastRatio: result.contrastRatio,
        isWcagCompliant: result.isWcagCompliant,
        errorKey: null,
        canRetry: false,
      });
    } catch (error) {
      if (seq !== paletteSeq.current) {
        return;
      }

      const status: number | null = error instanceof ApiError ? error.status : null;
      const errorKey: PaletteErrorKey =
        status === 400 || status === 422
          ? "identity.palette.invalidFile"
          : status === 429
            ? "identity.palette.rateLimited"
            : "identity.palette.serverError";
      const canRetry: boolean = status !== 400 && status !== 422 && status !== 429;

      setPalette({ ...EMPTY_PALETTE_STATE, status: "error", errorKey, canRetry });

      if (status === 429) {
        // A rate limit needs a short wait, then the retry button appears.
        paletteRetryTimer.current = window.setTimeout(() => {
          paletteRetryTimer.current = null;

          if (seq === paletteSeq.current) {
            setPalette((prev) => (prev.status === "error" ? { ...prev, canRetry: true } : prev));
          }
        }, PALETTE_RETRY_WAIT_MS);
      }
    }
  }

  /** Keeps the logo, clears its old asset, and starts a new upload and palette request. */
  function handleSelectLogo(file: File | null): void {
    logoUploadSeq.current += 1;
    logoPendingRef.current = null;
    handleChange({ logoFile: file, logoAssetId: null, logoUploadToken: null });
    setLogoUpload(EMPTY_UPLOAD_STATE);

    if (file === null) {
      clearPaletteRetryTimer();
      paletteSeq.current += 1;
      setPalette(EMPTY_PALETTE_STATE);
      return;
    }

    void runUpload("logo", file, null);
    void loadLogoPalette(file);
  }

  /** Retries the palette request of the current logo file. */
  function handleRetryPalette(): void {
    const file: File | null = data.logoFile;

    if (file !== null && palette.status === "error" && palette.canRetry) {
      void loadLogoPalette(file);
    }
  }

  /** Keeps the menu, clears its old asset, and starts a new upload. */
  function handleSelectMenu(file: File | null): void {
    menuUploadSeq.current += 1;
    menuPendingRef.current = null;
    handleChange({ menuFile: file, menuAssetId: null, menuUploadToken: null });
    setMenuUpload(EMPTY_UPLOAD_STATE);

    if (file !== null) {
      void runUpload("menu", file, null);
    }
  }

  /** Uploads the same logo again from the step that failed. The file is never lost. */
  function handleRetryLogo(): void {
    const file: File | null = data.logoFile;

    if (file !== null) {
      const pending: PendingUpload | null = logoPendingRef.current;
      void runUpload("logo", file, pending !== null && pending.file === file ? pending.stage : null);
    }
  }

  /** Uploads the same menu again from the step that failed. The file is never lost. */
  function handleRetryMenu(): void {
    const file: File | null = data.menuFile;

    if (file !== null) {
      const pending: PendingUpload | null = menuPendingRef.current;
      void runUpload("menu", file, pending !== null && pending.file === file ? pending.stage : null);
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
    if (
      data.logoAssetId === null ||
      data.logoUploadToken === null ||
      data.menuAssetId === null ||
      data.menuUploadToken === null
    ) {
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

    try {
      const submitResult: SubmitResult = await submitOnboardingRequest(data, idempotencyKeyRef.current);
      idempotencyKeyRef.current = null;
      setResult(submitResult);
      clearForm();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitError(t(lang, "submit.duplicate"));
      } else if (error instanceof ApiError && error.status === 422) {
        const fieldErrors: StepErrors = mapServerFieldErrors(error.errors);
        const firstField: string | undefined = Object.keys(fieldErrors)[0];

        if (firstField !== undefined) {
          setErrors(fieldErrors);
          setCurrentStep(stepOfField(firstField));
        } else {
          setSubmitError(t(lang, "error.submit"));
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
    paletteSeq.current += 1;
    clearPaletteRetryTimer();
    setLogoUrl(null);
    setMenuUrl(null);
    setLogoUpload(EMPTY_UPLOAD_STATE);
    setMenuUpload(EMPTY_UPLOAD_STATE);
    setPalette(EMPTY_PALETTE_STATE);
    setData(INITIAL_DATA);
    setErrors({});
    setSubmitError("");
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
                        palette={palette}
                        onChange={handleChange}
                        onRetryPalette={handleRetryPalette}
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
