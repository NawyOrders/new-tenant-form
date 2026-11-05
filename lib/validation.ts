// This file checks every step of the wizard. One function per step.
// Each function returns the errors of the step: an empty object means the step is valid.

import { t } from "./i18n";
import type { TranslationKey } from "./i18n";
import {
  ACCEPTED_MENU_TYPES,
  MAX_BRANCHES,
  MAX_MENU_FILES,
  MAX_MENU_SIZE_MB,
  STEP_ORDER,
} from "./constants";
import type { Lang, RegisterData } from "./types";

/** True when the text looks like #RRGGBB. */
export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

/** Removes a pasted country code and returns the 11-digit local mobile form. */
export function normalizeEgyptianPhone(value: string): string {
  const compact: string = value.replace(/[\s()-]/g, "");
  let digits: string = compact;

  if (digits.startsWith("+20")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0020")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("20") && digits.length === 12) {
    digits = digits.slice(2);
  }

  const localBody: string = digits.replace(/\D/g, "");

  // An international number has no leading zero; the local form needs it back.
  return /^1[0125]\d{8}$/.test(localBody) ? `0${localBody}` : localBody;
}

/** True for a local Egyptian mobile number: 11 digits starting with 010, 011, 012 or 015. */
export function isValidEgyptianPhone(value: string): boolean {
  return /^01[0125]\d{8}$/.test(normalizeEgyptianPhone(value));
}

/** The local form shown in the input. The form itself keeps the +20 form. */
export function phoneForInput(stored: string): string {
  return stored.startsWith("+20") ? `0${stored.slice(3)}` : stored;
}

/** The stored form: +20 followed by the 10 digits after the leading zero. */
export function toStoredEgyptianPhone(value: string): string {
  const local: string = normalizeEgyptianPhone(value);

  if (local === "" || local === "0") {
    return local;
  }

  // TODO: confirm with the backend that ownerPhone is +20XXXXXXXXXX before changing this format.
  return local.startsWith("0") ? `+20${local.slice(1)}` : local;
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

/** The providers accepted without a length rule, compared case-insensitively. */
const KNOWN_EMAIL_PROVIDERS: string[] = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
];

/** Splits the value at its one "@", or returns null when it does not have exactly one. */
function splitAtSign(value: string): { local: string; domain: string } | null {
  const parts: string[] = value.split("@");

  if (parts.length !== 2) {
    return null;
  }

  const local: string = parts[0];
  const domain: string = parts[1];

  if (local === "" || domain === "") {
    return null;
  }

  return { local, domain };
}

/** True when the local part is 3+ characters of letters, digits, dot, underscore or hyphen, with a letter. */
function isValidLocalPart(local: string): boolean {
  return local.length >= 3 && /^[A-Za-z0-9._-]+$/.test(local) && /[A-Za-z]/.test(local);
}

/** True when the domain is exactly one of the known providers. */
function isKnownProvider(domain: string): boolean {
  return KNOWN_EMAIL_PROVIDERS.includes(domain.toLowerCase());
}

/** True when the domain ends in com or net and its label before the TLD is 4+ letters or digits. */
function isValidCustomDomain(domain: string): boolean {
  const labels: string[] = domain.toLowerCase().split(".");
  const tld: string | undefined = labels[labels.length - 1];

  if (labels.length < 2 || (tld !== "com" && tld !== "net")) {
    return false;
  }

  const mainLabel: string = labels[labels.length - 2];

  return mainLabel.length >= 4 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(mainLabel);
}

/** True when the email follows the rule: a valid local part and a known provider or a com / net domain. */
export function isValidEmail(value: string): boolean {
  const parts: { local: string; domain: string } | null = splitAtSign(value.trim());

  if (parts === null || !isValidLocalPart(parts.local)) {
    return false;
  }

  return isKnownProvider(parts.domain) || isValidCustomDomain(parts.domain);
}

/** The error of the menu files, empty when the list follows the count, type, size and name rules. */
function getMenuFilesError(files: File[], lang: Lang): string {
  if (files.length === 0) {
    return t(lang, "error.menuMissing");
  }

  if (files.length > MAX_MENU_FILES) {
    return t(lang, "menu.tooManyFiles");
  }

  const names: Set<string> = new Set<string>();

  for (const file of files) {
    const name: string = file.name.trim().toLowerCase();

    if (names.has(name)) {
      return t(lang, "menu.duplicate");
    }

    names.add(name);

    if (!ACCEPTED_MENU_TYPES.includes(file.type)) {
      return t(lang, "error.fileType");
    }

    if (file.size > MAX_MENU_SIZE_MB * 1024 * 1024) {
      return t(lang, "upload.tooLarge");
    }
  }

  return "";
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

  const menuFilesError: string = getMenuFilesError(data.menuFiles, lang);
  if (menuFilesError !== "") {
    errors["menuFile"] = menuFilesError;
  }

  const ownerNameError: string = getNameError(data.owner.fullName, lang);
  if (ownerNameError !== "") {
    errors["owner.fullName"] = ownerNameError;
  }

  if (data.owner.phone.trim() === "") {
    errors["owner.phone"] = t(lang, "error.required");
  } else if (!isValidEgyptianPhone(data.owner.phone)) {
    errors["owner.phone"] = t(lang, "error.phone.invalid");
  }

  if (data.owner.email.trim() === "") {
    errors["owner.email"] = t(lang, "error.required");
  } else if (!isValidEmail(data.owner.email)) {
    errors["owner.email"] = t(lang, "error.email.invalid");
  }

  return errors;
}

/** Step 2: the identity of the restaurant (the names and the colors). */
export function validateStep2(data: RegisterData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};

  const restaurantNameArError: string = getNameError(data.restaurantNameAr, lang, "ar");
  if (restaurantNameArError !== "") {
    errors["restaurantNameAr"] = restaurantNameArError;
  }

  const restaurantNameEnError: string = getNameError(data.restaurantNameEn, lang, "en");
  if (restaurantNameEnError !== "") {
    errors["restaurantNameEn"] = restaurantNameEnError;
  }

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

    if (branch.city.trim() === "") {
      errors[`branches.${index}.city`] = t(lang, "error.branch.city.required");
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
