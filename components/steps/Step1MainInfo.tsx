// This file is step 1 "البيانات الاساسية": the name of the restaurant, the logo, the menu,
// and the details of the owner.
// The logo and the menu are TWO different fields with two different rules, so they have two
// separate upload areas and they never share one.

"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import FileUpload from "@/components/ui/FileUpload";
import TextInput from "@/components/ui/TextInput";
import {
  ACCEPTED_LOGO_INPUT,
  ACCEPTED_LOGO_TYPES,
  ACCEPTED_MENU_INPUT,
  ACCEPTED_MENU_TYPES,
  MAX_LOGO_SIZE_MB,
  MAX_MENU_SIZE_MB,
} from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Lang, RegisterData, StepErrors } from "@/lib/types";

type Step1MainInfoProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  /** The local picture of the logo, used to show the thumbnail. */
  logoUrl: string | null;
  /** The local picture of the menu, null when the menu is a PDF file. */
  menuUrl: string | null;
  onChange: (patch: Partial<RegisterData>) => void;
};

export default function Step1MainInfo({
  data,
  errors,
  lang,
  logoUrl,
  menuUrl,
  onChange,
}: Step1MainInfoProps): ReactElement {
  const [fileError, setFileError] = useState<{ logo: string; menu: string }>({ logo: "", menu: "" });

  /** Checks the rules of the logo, then keeps the file in the form state. */
  function handleLogoFile(file: File | null): void {
    if (file === null) {
      setFileError({ ...fileError, logo: "" });
      onChange({ logoFile: null });
      return;
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setFileError({ ...fileError, logo: t(lang, "error.fileType") });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setFileError({ ...fileError, logo: t(lang, "error.fileSize") });
      return;
    }

    setFileError({ ...fileError, logo: "" });
    // The logo is kept in the state for the live preview ONLY.
    // It is NOT uploaded anywhere yet: the real upload will be connected when the backend is ready.
    onChange({ logoFile: file });
  }

  /** Checks the rules of the menu, then keeps the file in the form state. */
  function handleMenuFile(file: File | null): void {
    if (file === null) {
      setFileError({ ...fileError, menu: "" });
      onChange({ menuFile: null });
      return;
    }

    if (!ACCEPTED_MENU_TYPES.includes(file.type)) {
      setFileError({ ...fileError, menu: t(lang, "error.fileType") });
      return;
    }

    if (file.size > MAX_MENU_SIZE_MB * 1024 * 1024) {
      setFileError({ ...fileError, menu: t(lang, "error.fileSize") });
      return;
    }

    setFileError({ ...fileError, menu: "" });
    // The menu file is kept in the state for the live preview ONLY.
    // It is NOT uploaded anywhere yet: the real upload will be connected when the backend is ready.
    onChange({ menuFile: file });
  }

  const logoError: string = fileError.logo !== "" ? fileError.logo : (errors["logoFile"] ?? "");
  const menuError: string = fileError.menu !== "" ? fileError.menu : (errors["menuFile"] ?? "");
  // A PDF file has no picture, so only the images get a thumbnail.
  const menuThumbnailUrl: string | null =
    data.menuFile !== null && data.menuFile.type.startsWith("image/") ? menuUrl : null;

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.1")}</h2>

      <div className="mt-6 space-y-5">
        <TextInput
          label={t(lang, "field.restaurantName")}
          name="restaurantName"
          placeholder={t(lang, "field.restaurantName.placeholder")}
          value={data.restaurantName}
          error={errors["restaurantName"]}
          required
          onChange={(value) => onChange({ restaurantName: value })}
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
        />

        {/* Field B: the menu of the restaurant. It is NOT the same field as the logo. */}
        <FileUpload
          id="restaurant-menu"
          label={t(lang, "field.menu")}
          dropText={t(lang, "field.menu.drop")}
          hint={t(lang, "field.menu.hint")}
          accept={ACCEPTED_MENU_INPUT}
          file={data.menuFile}
          previewUrl={menuThumbnailUrl}
          error={menuError}
          removeLabel={t(lang, "btn.remove")}
          onSelect={handleMenuFile}
        />

        <TextInput
          label={t(lang, "field.ownerName")}
          name="owner-full-name"
          placeholder={t(lang, "field.ownerName.placeholder")}
          value={data.owner.fullName}
          error={errors["owner.fullName"]}
          required
          onChange={(value) => onChange({ owner: { ...data.owner, fullName: value } })}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label={t(lang, "field.phone")}
            name="owner-phone"
            type="tel"
            dir="ltr"
            placeholder={t(lang, "field.phone.placeholder")}
            hint={t(lang, "field.phone.hint")}
            value={data.owner.phone}
            error={errors["owner.phone"]}
            required
            onChange={(value) => onChange({ owner: { ...data.owner, phone: value } })}
          />

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
          />
        </div>
      </div>
    </div>
  );
}
