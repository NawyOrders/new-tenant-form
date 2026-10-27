// This file checks every step of the wizard. One function per step.
// Each function returns the errors of the step: an empty object means the step is valid.

import { t } from "./i18n";
import type { TranslationKey } from "./i18n";
import { MAX_BRANCHES, STEP_ORDER } from "./constants";
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

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;

/** "any" allows both scripts (owner and branch names), "ar" and "en" allow one script. */
type NameScript = "any" | "ar" | "en";

type NameRules = {
  allowedChars: RegExp;
  hasLetter: RegExp;
  invalidKey: TranslationKey;
};

const NAME_RULES: Record<NameScript, NameRules> = {
  any: {
    allowedChars: /^[\u0600-\u06FFA-Za-z .'-]+$/,
    hasLetter: /[\u0600-\u06FFA-Za-z]/,
    invalidKey: "error.name.invalid",
  },
  ar: {
    allowedChars: /^[\u0600-\u06FF .'-]+$/,
    hasLetter: /[\u0600-\u06FF]/,
    invalidKey: "error.nameAr.invalid",
  },
  en: {
    allowedChars: /^[A-Za-z .'-]+$/,
    hasLetter: /[A-Za-z]/,
    invalidKey: "error.nameEn.invalid",
  },
};

/** True when the name is 2 to 60 characters and follows the rules of one script. */
function isValidNameFor(value: string, script: NameScript): boolean {
  const trimmed: string = value.trim();
  const rules: NameRules = NAME_RULES[script];

  return (
    trimmed.length >= NAME_MIN_LENGTH &&
    trimmed.length <= NAME_MAX_LENGTH &&
    rules.allowedChars.test(trimmed) &&
    rules.hasLetter.test(trimmed)
  );
}

/** True when the name fits any script (owner and branch names). */
export function isValidName(value: string): boolean {
  return isValidNameFor(value, "any");
}

/** True when the name uses Arabic letters only. */
export function isValidArabicName(value: string): boolean {
  return isValidNameFor(value, "ar");
}

/** True when the name uses Latin letters only. */
export function isValidEnglishName(value: string): boolean {
  return isValidNameFor(value, "en");
}

/** The error key of an invalid name: the length rule first, then the characters rule. */
function getNameErrorKey(value: string, script: NameScript): TranslationKey {
  const trimmed: string = value.trim();

  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return "error.name.length";
  }

  return NAME_RULES[script].invalidKey;
}

/** The error message of a name field, empty when the value is valid. */
function getNameError(value: string, lang: Lang, script: NameScript = "any"): string {
  if (value.trim() === "") {
    return t(lang, "error.required");
  }

  return isValidNameFor(value, script) ? "" : t(lang, getNameErrorKey(value, script));
}

/** True when the email looks like an email address. */
export function isValidEmail(value: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value.trim());
}

/** Step 1: the main info of the restaurant and of the owner. */
export function validateStep1(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  const restaurantNameArError: string = getNameError(data.restaurantNameAr, lang, "ar");
  if (restaurantNameArError !== "") {
    errors["restaurantNameAr"] = restaurantNameArError;
  }

  const restaurantNameEnError: string = getNameError(data.restaurantNameEn, lang, "en");
  if (restaurantNameEnError !== "") {
    errors["restaurantNameEn"] = restaurantNameEnError;
  }

  if (data.logoFile === null) {
    errors["logoFile"] = t(lang, "error.logoMissing");
  }

  if (data.menuFile === null) {
    errors["menuFile"] = t(lang, "error.menuMissing");
  }

  const ownerNameError: string = getNameError(data.owner.fullName, lang);
  if (ownerNameError !== "") {
    errors["owner.fullName"] = ownerNameError;
  }

  if (data.owner.phone.trim() === "") {
    errors["owner.phone"] = t(lang, "error.required");
  } else if (!isValidEgyptianPhone(data.owner.phone)) {
    errors["owner.phone"] = t(lang, "error.phone");
  }

  if (data.owner.email.trim() === "") {
    errors["owner.email"] = t(lang, "error.required");
  } else if (!isValidEmail(data.owner.email)) {
    errors["owner.email"] = t(lang, "error.email.invalid");
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
    const branchNameError: string = getNameError(branch.name, lang);
    if (branchNameError !== "") {
      errors[`branches.${index}.name`] = branchNameError;
    }

    if (branch.openingTime === branch.closingTime) {
      errors[`branches.${index}.hours`] = t(lang, "error.hours.equal");
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

/** Step 4: the package. One offer must be chosen. */
export function validateStep4(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.subscriptionOfferId === null) {
    errors["subscriptionOfferId"] = t(lang, "error.chooseOffer");
  }

  return errors;
}

/** Runs the check of one step. */
export function validateStep(step: number, data: RegisterData, lang: Lang): Record<string, string> {
  const key = STEP_ORDER[step - 1];
  if (key === "main") return validateStep1(data, lang);
  if (key === "identity") return validateStep2(data, lang);
  if (key === "branches") return validateStep3(data, lang);
  if (key === "package") return validateStep4(data, lang);
  return {};
}

/** The error of one field, empty when the field is valid. Used when the visitor leaves a field. */
export function getFieldError(field: string, data: RegisterData, lang: Lang): string {
  if (field === "restaurantNameAr") {
    return getNameError(data.restaurantNameAr, lang, "ar");
  }

  if (field === "restaurantNameEn") {
    return getNameError(data.restaurantNameEn, lang, "en");
  }

  if (field === "owner.fullName") {
    return getNameError(data.owner.fullName, lang);
  }

  if (field === "owner.email") {
    if (data.owner.email.trim() === "") {
      return t(lang, "error.required");
    }

    return isValidEmail(data.owner.email) ? "" : t(lang, "error.email.invalid");
  }

  const branchMatch = /^branches\.(\d+)\.name$/.exec(field);
  if (branchMatch !== null) {
    const branch = data.branches[Number.parseInt(branchMatch[1], 10)];
    return branch === undefined ? "" : getNameError(branch.name, lang);
  }

  return "";
}
