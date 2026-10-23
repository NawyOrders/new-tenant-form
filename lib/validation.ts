// This file checks every step of the wizard. One function per step.
// Each function returns the errors of the step: an empty object means the step is valid.

import { t } from "./i18n";
import { MAX_BRANCHES } from "./constants";
import type { Lang, RegisterData } from "./types";

/** True when the text looks like #RRGGBB. */
export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

/** True when the phone is an Egyptian mobile number (010, 011, 012 or 015). */
export function isValidEgyptianPhone(value: string): boolean {
  const digits: string = value.replace(/[\s()-]/g, "");

  return /^(\+?20|0020|0)?1[0125]\d{8}$/.test(digits);
}

/** True when the email looks like an email address. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Step 1: the main info of the restaurant and of the owner. */
export function validateStep1(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.restaurantName.trim() === "") {
    errors["restaurantName"] = t(lang, "error.required");
  }

  if (data.logoFile === null) {
    errors["logoFile"] = t(lang, "error.logoMissing");
  }

  if (data.menuFile === null) {
    errors["menuFile"] = t(lang, "error.menuMissing");
  }

  if (data.owner.fullName.trim() === "") {
    errors["owner.fullName"] = t(lang, "error.required");
  }

  if (data.owner.phone.trim() === "") {
    errors["owner.phone"] = t(lang, "error.required");
  } else if (!isValidEgyptianPhone(data.owner.phone)) {
    errors["owner.phone"] = t(lang, "error.phone");
  }

  if (data.owner.email.trim() === "") {
    errors["owner.email"] = t(lang, "error.required");
  } else if (!isValidEmail(data.owner.email)) {
    errors["owner.email"] = t(lang, "error.email");
  }

  return errors;
}

/** Step 2: the identity of the restaurant (the colors). */
export function validateStep2(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.brand.primaryColor.trim() === "") {
    errors["brand.primaryColor"] = t(lang, "error.required");
  } else if (!isValidHexColor(data.brand.primaryColor)) {
    errors["brand.primaryColor"] = t(lang, "error.color");
  }

  if (data.brand.backgroundColor.trim() !== "" && !isValidHexColor(data.brand.backgroundColor)) {
    errors["brand.backgroundColor"] = t(lang, "error.color");
  }

  if (data.brand.accentColor.trim() !== "" && !isValidHexColor(data.brand.accentColor)) {
    errors["brand.accentColor"] = t(lang, "error.color");
  }

  return errors;
}

/** Step 3: the branches. Between 1 and 2 branches, each one complete. */
export function validateStep3(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.branches.length === 0) {
    errors["branches"] = t(lang, "error.minBranch");
    return errors;
  }

  if (data.branches.length > MAX_BRANCHES) {
    errors["branches"] = t(lang, "error.maxBranches");
  }

  data.branches.forEach((branch, index) => {
    if (branch.name.trim() === "") {
      errors[`branches.${index}.name`] = t(lang, "error.required");
    }

    if (branch.address.trim() === "") {
      errors[`branches.${index}.address`] = t(lang, "error.required");
    }

    if (branch.latitude === null || branch.longitude === null) {
      errors[`branches.${index}.latitude`] = t(lang, "error.required");
    }
  });

  return errors;
}

/** Step 4: the package. A plan must be chosen. */
export function validateStep4(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.planId === null) {
    errors["planId"] = t(lang, "error.required");
  }

  return errors;
}

import { STEP_ORDER } from "./constants";

/** Runs the check of one step. */
export function validateStep(step: number, data: RegisterData, lang: Lang): Record<string, string> {
  const key = STEP_ORDER[step - 1];
  if (key === "main") return validateStep1(data, lang);
  if (key === "identity") return validateStep2(data, lang);
  if (key === "branches") return validateStep3(data, lang);
  if (key === "package") return validateStep4(data, lang);
  if (key === "payment") return {};
  if (step === 1) return validateStep1(data, lang);
  if (step === 2) return validateStep2(data, lang);
  if (step === 3) return validateStep3(data, lang);
  if (step === 4) return validateStep4(data, lang);
  return {};
}
