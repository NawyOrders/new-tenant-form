// This file is step 1 "البيانات الاساسية": the Arabic and English names of the restaurant,
// the logo, the menu, and the details of the owner.
// The logo and the menu are TWO different fields with two different rules, so they have two
// separate upload areas and they never share one.

"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import FileUpload from "@/components/ui/FileUpload";
import MenuFileUpload from "@/components/ui/MenuFileUpload";
import TextInput from "@/components/ui/TextInput";
import {
  ACCEPTED_LOGO_INPUT,
  ACCEPTED_LOGO_TYPES,
  ACCEPTED_MENU_INPUT,
  ACCEPTED_MENU_TYPES,
  MAX_LOGO_SIZE_MB,
  MAX_MENU_FILES,
  MAX_MENU_SIZE_MB,
} from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Lang, MenuFileUploadState, RegisterData, StepErrors, UploadState } from "@/lib/types";
import { phoneForInput, toStoredEgyptianPhone } from "@/lib/validation";

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
}: Step1MainInfoProps): ReactElement {
  const [fileError, setFileError] = useState<{ logo: string; menu: string }>({ logo: "", menu: "" });

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
