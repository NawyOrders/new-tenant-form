// This file is step 1 "البيانات الاساسية": the Arabic and English names of the restaurant,
// the subdomain, the logo, the menu, and the details of the owner.
// The logo and the menu are TWO different fields with two different rules, so they have two
// separate upload areas and they never share one.

"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import FileUpload from "@/components/ui/FileUpload";
import MenuFileUpload from "@/components/ui/MenuFileUpload";
import TextInput from "@/components/ui/TextInput";
import { checkSubdomainAvailability, subdomainReasonKey } from "@/lib/api/onboarding";
import {
  ACCEPTED_LOGO_INPUT,
  ACCEPTED_LOGO_TYPES,
  ACCEPTED_MENU_INPUT,
  ACCEPTED_MENU_TYPES,
  MAX_LOGO_SIZE_MB,
  MAX_MENU_FILES,
  MAX_MENU_SIZE_MB,
  SUBDOMAIN_CHECK_DEBOUNCE_MS,
  SUBDOMAIN_MAX_LENGTH,
  SUBDOMAIN_MIN_LENGTH,
} from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Lang, MenuFileUploadState, RegisterData, StepErrors, UploadState } from "@/lib/types";
import { isReservedSubdomain, normalizeSubdomain, phoneForInput, toStoredEgyptianPhone } from "@/lib/validation";

/** The state of the subdomain availability check. */
type SubdomainStatus =
  | { kind: "idle" }
  | { kind: "tooShort" }
  | { kind: "reserved" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; key: TranslationKey }
  | { kind: "failed" };

/** The one message under the subdomain field and its color. */
type SubdomainMessage = {
  text: string;
  tone: "error" | "success" | "muted";
};

type Step1MainInfoProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  /** The local picture of the logo, used to show the thumbnail. */
  logoUrl: string | null;
  /** The state of the logo upload. */
  logoUpload: UploadState;
  /** The state of every menu file upload. */
  menuUploads: MenuFileUploadState[];
  onChange: (patch: Partial<RegisterData>) => void;
  /** Called with the field key when a validated field loses focus. */
  onBlurField: (field: string) => void;
  /** Keeps the logo and starts its upload (null removes it). */
  onSelectLogo: (file: File | null) => void;
  /** Adds the chosen menu files and starts their upload. */
  onAddMenuFiles: (files: File[]) => void;
  /** Removes one menu file. */
  onRemoveMenuFile: (fileName: string) => void;
  /** Uploads the same logo again after a failure. */
  onRetryLogo: () => void;
  /** Uploads one failed menu file again. */
  onRetryMenuFile: (fileName: string) => void;
  /** Reports the value of every finished check, so the wizard knows which one passed. */
  onSubdomainCheckResult: (value: string, available: boolean) => void;
  /** Increments when the wizard wants the current value checked again before moving on. */
  subdomainCheckToken: number;
};

export default function Step1MainInfo({
  data,
  errors,
  lang,
  logoUrl,
  logoUpload,
  menuUploads,
  onChange,
  onBlurField,
  onSelectLogo,
  onAddMenuFiles,
  onRemoveMenuFile,
  onRetryLogo,
  onRetryMenuFile,
  onSubdomainCheckResult,
  subdomainCheckToken,
}: Step1MainInfoProps): ReactElement {
  const [fileError, setFileError] = useState<{ logo: string; menu: string }>({ logo: "", menu: "" });
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>({ kind: "idle" });

  // The props of the wizard change on every render, so the refs keep the effects stable.
  const onSubdomainCheckResultRef = useRef(onSubdomainCheckResult);
  onSubdomainCheckResultRef.current = onSubdomainCheckResult;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef<number>(0);
  const inFlightValueRef = useRef<string | null>(null);
  const lastTokenRef = useRef<number>(subdomainCheckToken);

  /** Cancels the pending wait and the request in flight; their answers are ignored. */
  function stopSubdomainCheck(): void {
    seqRef.current += 1;
    inFlightValueRef.current = null;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (abortRef.current !== null) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  /** Runs one availability check for the current value. */
  function runSubdomainCheck(value: string): void {
    stopSubdomainCheck();
    const seq: number = seqRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightValueRef.current = value;
    setSubdomainStatus({ kind: "checking" });

    void checkSubdomainAvailability(value, controller.signal)
      .then((result) => {
        if (seq !== seqRef.current) {
          return;
        }

        inFlightValueRef.current = null;

        if (result.available) {
          setSubdomainStatus({ kind: "available" });
          onSubdomainCheckResultRef.current(value, true);
        } else {
          setSubdomainStatus({ kind: "unavailable", key: subdomainReasonKey(result.reason) });
          onSubdomainCheckResultRef.current(value, false);
        }
      })
      .catch(() => {
        if (seq !== seqRef.current) {
          return;
        }

        inFlightValueRef.current = null;
        setSubdomainStatus({ kind: "failed" });
        onSubdomainCheckResultRef.current(value, false);
      });
  }

  /** True when the value passes the frontend rules and may be checked with the backend. */
  function passesFrontendRules(value: string): boolean {
    return value.length >= SUBDOMAIN_MIN_LENGTH && !isReservedSubdomain(value);
  }

  /** The status of a value that the frontend rules already reject or leave incomplete. */
  function blockedStatus(value: string): SubdomainStatus {
    if (value === "") return { kind: "idle" };
    if (value.length < SUBDOMAIN_MIN_LENGTH) return { kind: "tooShort" };
    return { kind: "reserved" };
  }

  // The frontend rules run first; the backend check waits for a pause in typing.
  useEffect(() => {
    const value: string = data.subdomain;

    if (!passesFrontendRules(value)) {
      stopSubdomainCheck();
      setSubdomainStatus(blockedStatus(value));
      onSubdomainCheckResultRef.current(value, false);
      return;
    }

    setSubdomainStatus({ kind: "checking" });
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runSubdomainCheck(value);
    }, SUBDOMAIN_CHECK_DEBOUNCE_MS);

    return stopSubdomainCheck;
  }, [data.subdomain]);

  // "Next" was blocked: check the current value now instead of waiting for the pause.
  useEffect(() => {
    if (subdomainCheckToken === lastTokenRef.current) {
      return;
    }

    lastTokenRef.current = subdomainCheckToken;
    const value: string = data.subdomain;

    if (!passesFrontendRules(value) || inFlightValueRef.current === value) {
      return;
    }

    runSubdomainCheck(value);
  }, [subdomainCheckToken, data.subdomain]);

  /** Keeps only lowercase letters and digits, and never more than the maximum length. */
  function handleSubdomainInput(raw: string): void {
    onChange({ subdomain: normalizeSubdomain(raw).slice(0, SUBDOMAIN_MAX_LENGTH) });
  }

  const subdomainMessage: SubdomainMessage = describeSubdomainStatus(subdomainStatus, lang, errors["subdomain"]);

  /** Checks the rules of the logo, then hands the file to the upload. */
  function handleLogoFile(file: File | null): void {
    if (file === null) {
      setFileError({ ...fileError, logo: "" });
      onSelectLogo(null);
      return;
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setFileError({ ...fileError, logo: t(lang, "error.fileType") });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setFileError({ ...fileError, logo: t(lang, "upload.tooLarge") });
      return;
    }

    setFileError({ ...fileError, logo: "" });
    onSelectLogo(file);
  }

  /** Checks the rules of the new menu files, then hands them to the upload. */
  function handleMenuFiles(incoming: File[]): void {
    if (incoming.length === 0) {
      return;
    }

    const names: Set<string> = new Set<string>(
      data.menuFiles.map((file: File) => file.name.trim().toLowerCase()),
    );
    let count: number = data.menuFiles.length;

    for (const file of incoming) {
      if (!ACCEPTED_MENU_TYPES.includes(file.type)) {
        setFileError({ ...fileError, menu: t(lang, "error.fileType") });
        return;
      }

      if (file.size > MAX_MENU_SIZE_MB * 1024 * 1024) {
        setFileError({ ...fileError, menu: t(lang, "upload.tooLarge") });
        return;
      }

      const name: string = file.name.trim().toLowerCase();

      if (names.has(name)) {
        setFileError({ ...fileError, menu: t(lang, "menu.duplicate") });
        return;
      }

      names.add(name);
      count += 1;

      if (count > MAX_MENU_FILES) {
        setFileError({ ...fileError, menu: t(lang, "menu.tooManyFiles") });
        return;
      }
    }

    setFileError({ ...fileError, menu: "" });
    onAddMenuFiles(incoming);
  }

  /** The field shows the local number; the form keeps the +20 stored form. */
  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange({ owner: { ...data.owner, phone: toStoredEgyptianPhone(event.target.value) } });
  }

  const logoError: string = fileError.logo !== "" ? fileError.logo : (errors["logoFile"] ?? "");
  const menuError: string = fileError.menu !== "" ? fileError.menu : (errors["menuFile"] ?? "");
  const isMenuUploading: boolean = menuUploads.some((entry: MenuFileUploadState) => entry.status === "uploading");

  /** Removes one menu file and clears the list error, because the list changed. */
  function handleRemoveMenu(fileName: string): void {
    setFileError({ ...fileError, menu: "" });
    onRemoveMenuFile(fileName);
  }

  /** Retries one menu file and clears its list error. */
  function handleRetryMenu(fileName: string): void {
    setFileError({ ...fileError, menu: "" });
    onRetryMenuFile(fileName);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.1")}</h2>

      <div className="mt-6 space-y-5">
        <TextInput
          label={t(lang, "field.restaurantNameAr")}
          name="restaurantNameAr"
          placeholder={t(lang, "field.restaurantNameAr.placeholder")}
          value={data.restaurantNameAr}
          error={errors["restaurantNameAr"]}
          required
          onChange={(value) => onChange({ restaurantNameAr: value })}
          onBlur={() => onBlurField("restaurantNameAr")}
        />

        <TextInput
          label={t(lang, "field.restaurantNameEn")}
          name="restaurantNameEn"
          placeholder={t(lang, "field.restaurantNameEn.placeholder")}
          value={data.restaurantNameEn}
          error={errors["restaurantNameEn"]}
          required
          dir="ltr"
          onChange={(value) => onChange({ restaurantNameEn: value })}
          onBlur={() => onBlurField("restaurantNameEn")}
        />

        {/* The subdomain becomes the tenant slug after approval. */}
        <div>
          <label htmlFor="field-subdomain" className="mb-2 block text-sm font-semibold text-ink">
            {t(lang, "subdomain.label")}
            <span className="text-danger-strong"> *</span>
          </label>

          <input
            id="field-subdomain"
            name="subdomain"
            type="text"
            dir="ltr"
            value={data.subdomain}
            placeholder={t(lang, "subdomain.placeholder")}
            autoComplete="off"
            spellCheck={false}
            required
            onChange={(event) => handleSubdomainInput(event.target.value)}
            onBlur={() => onBlurField("subdomain")}
            aria-invalid={subdomainMessage.tone === "error"}
            aria-describedby="field-subdomain-message"
            className={`h-12 w-full rounded-panel border bg-card px-4 text-left text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/30 ${
              subdomainMessage.tone === "error" ? "border-danger-strong" : "border-line"
            }`}
          />

          <p
            id="field-subdomain-message"
            role={subdomainMessage.tone === "error" ? "alert" : "status"}
            className={`mt-1.5 text-xs ${
              subdomainMessage.tone === "success"
                ? "font-semibold text-success-strong"
                : subdomainMessage.tone === "error"
                  ? "font-semibold text-danger-strong"
                  : "text-muted"
            }`}
          >
            {subdomainMessage.text}
          </p>

          {subdomainStatus.kind === "failed" ? (
            <button
              type="button"
              onClick={() => runSubdomainCheck(data.subdomain)}
              className="mt-1 text-xs font-semibold text-primary-dark underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t(lang, "subdomain.retry")}
            </button>
          ) : null}
        </div>

        {/* Field A: the logo of the restaurant. */}
        <FileUpload
          id="restaurant-logo"
          label={t(lang, "field.logo")}
          dropText={t(lang, "field.logo.drop")}
          hint={t(lang, "field.logo.hint")}
          accept={ACCEPTED_LOGO_INPUT}
          file={data.logoFile}
          previewUrl={logoUrl}
          error={logoError}
          removeLabel={t(lang, "btn.remove")}
          onSelect={handleLogoFile}
          uploadStatus={logoUpload.status}
          statusText={uploadStatusText(lang, logoUpload)}
          retryLabel={t(lang, "upload.retry")}
          onRetry={onRetryLogo}
        />

        {/* Field B: the menu of the restaurant. It is NOT the same field as the logo. */}
        <MenuFileUpload
          id="restaurant-menu"
          lang={lang}
          files={data.menuFiles}
          uploads={menuUploads}
          error={menuError}
          accept={ACCEPTED_MENU_INPUT}
          disabled={isMenuUploading}
          onAdd={handleMenuFiles}
          onRemove={handleRemoveMenu}
          onRetry={handleRetryMenu}
        />

        <TextInput
          label={t(lang, "field.ownerName")}
          name="owner-full-name"
          placeholder={t(lang, "field.ownerName.placeholder")}
          value={data.owner.fullName}
          error={errors["owner.fullName"]}
          required
          onChange={(value) => onChange({ owner: { ...data.owner, fullName: value } })}
          onBlur={() => onBlurField("owner.fullName")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="owner-phone" className="mb-2 block text-sm font-semibold text-ink">
              {t(lang, "field.phone")}
              <span className="text-danger-strong"> *</span>
            </label>

            <div
              dir="ltr"
              className={`flex h-12 items-center overflow-hidden rounded-panel border bg-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 ${
                errors["owner.phone"] !== undefined ? "border-danger-strong" : "border-line"
              }`}
            >
              {/* The country code is fixed and is not part of the typed value. */}
              <span className="pointer-events-none flex h-full shrink-0 select-none items-center border-e border-line px-3 text-sm font-semibold text-muted">
                +20
              </span>

              <input
                id="owner-phone"
                name="owner-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                value={phoneForInput(data.owner.phone)}
                placeholder={t(lang, "field.phone.placeholder")}
                required
                aria-invalid={errors["owner.phone"] !== undefined}
                aria-describedby={
                  errors["owner.phone"] !== undefined ? "owner-phone-error" : "owner-phone-hint"
                }
                onChange={handlePhoneChange}
                className="h-full w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>

            {errors["owner.phone"] !== undefined ? (
              <p
                id="owner-phone-error"
                role="alert"
                className="mt-1.5 text-xs font-semibold text-danger-strong"
              >
                {errors["owner.phone"]}
              </p>
            ) : (
              <p id="owner-phone-hint" className="mt-1.5 text-xs text-muted">
                {t(lang, "field.phone.hint")}
              </p>
            )}
          </div>

          <TextInput
            label={t(lang, "field.email")}
            name="owner-email"
            type="email"
            dir="ltr"
            placeholder={t(lang, "field.email.placeholder")}
            value={data.owner.email}
            error={errors["owner.email"]}
            required
            onChange={(value) => onChange({ owner: { ...data.owner, email: value } })}
            onBlur={() => onBlurField("owner.email")}
          />
        </div>
      </div>
    </div>
  );
}

/** The text of one upload state: the error key wins, then the state itself. */
function uploadStatusText(lang: Lang, state: UploadState): string {
  if (state.errorKey !== null) {
    return t(lang, state.errorKey);
  }

  if (state.status === "uploading") return t(lang, "upload.uploading");
  if (state.status === "done") return t(lang, "upload.done");

  return "";
}

/** The one message under the subdomain field: the check result wins, then the blur error, then the hint. */
function describeSubdomainStatus(
  status: SubdomainStatus,
  lang: Lang,
  error: string | undefined,
): SubdomainMessage {
  if (status.kind === "checking") return { text: t(lang, "subdomain.checking"), tone: "muted" };
  if (status.kind === "available") return { text: t(lang, "subdomain.available"), tone: "success" };
  if (status.kind === "tooShort") return { text: t(lang, "subdomain.tooShort"), tone: "error" };
  if (status.kind === "reserved") return { text: t(lang, "subdomain.reserved"), tone: "error" };
  if (status.kind === "unavailable") return { text: t(lang, status.key), tone: "error" };
  if (status.kind === "failed") return { text: t(lang, "subdomain.checkFailed"), tone: "error" };

  if (error !== undefined && error !== "") {
    return { text: error, tone: "error" };
  }

  return { text: t(lang, "subdomain.hint"), tone: "muted" };
}
