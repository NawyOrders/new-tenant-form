// This file turns the errors of a failed submit into form field errors.
// A key that does not match a field is kept as a general error, so no message is hidden.

import type { StepErrors } from "@/lib/types";

/** One backend error that has no matching form field. */
export type GeneralServerError = {
  field: string;
  message: string;
};

/** The field errors and the errors that stay general. */
export type MappedServerErrors = {
  fields: StepErrors;
  general: GeneralServerError[];
};

/** The form field of one backend field name, or null when the name is not known. */
function mapFieldName(name: string): string | null {
  const normalized: string = name.trim().replace(/\[(\d+)\]/g, ".$1");
  const lower: string = normalized.toLowerCase();

  if (lower === "restaurantnamear") return "restaurantNameAr";
  if (lower === "restaurantnameen") return "restaurantNameEn";
  if (lower === "subscriptionofferid") return "subscriptionOfferId";
  if (lower === "ownerfullname") return "owner.fullName";
  if (lower === "owneremail") return "owner.email";
  if (lower === "ownerphone") return "owner.phone";

  const branchMatch: RegExpExecArray | null = /^branches?\.(\d+)\.([a-z0-9]+)$/i.exec(normalized);

  if (branchMatch !== null) {
    const index: string = branchMatch[1];
    const property: string = branchMatch[2].toLowerCase();

    if (property === "name") return `branches.${index}.name`;
    if (property === "addressline1" || property === "address") return `branches.${index}.address`;
    if (property === "city") return `branches.${index}.city`;
    if (property === "latitude" || property === "longitude") return `branches.${index}.${property}`;
  }

  return null;
}

/** Reads one message out of a backend error value. */
function firstMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message: string = firstMessage(item);
      if (message !== "") return message;
    }
  }

  if (value !== null && typeof value === "object" && "message" in value) {
    const message: unknown = (value as { message: unknown }).message;
    if (typeof message === "string") return message;
  }

  return "";
}

/** Maps the errors of a 400 or a 422 response to the form. */
export function mapServerErrors(errors: unknown): MappedServerErrors {
  const mapped: MappedServerErrors = { fields: {}, general: [] };

  const add = (name: string, message: string): void => {
    if (message === "") {
      return;
    }

    const field: string | null = mapFieldName(name);

    if (field === null) {
      mapped.general.push({ field: name, message });
      return;
    }

    if (mapped.fields[field] === undefined) {
      mapped.fields[field] = message;
    }
  };

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (item === null || typeof item !== "object") continue;

      const record = item as Record<string, unknown>;
      const name: unknown = record.field ?? record.property ?? record.name;

      if (typeof name === "string") {
        add(name, firstMessage(record.message ?? record.error));
      }
    }

    return mapped;
  }

  if (errors !== null && typeof errors === "object") {
    for (const [name, value] of Object.entries(errors)) {
      add(name, firstMessage(value));
    }
  }

  return mapped;
}
