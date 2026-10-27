// This file sends the onboarding request and maps the errors of the backend to the form.

import { ApiError, apiPost } from "./client";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants";
import type {
  OnboardingBranchPayload,
  OnboardingSubmitPayload,
  RegisterData,
  StepErrors,
  SubmitResult,
} from "@/lib/types";

const ONBOARDING_PATH = "/api/v1/onboarding-requests";

/** Builds the body of the registration request. */
export function buildOnboardingPayload(data: RegisterData): OnboardingSubmitPayload {
  const subscriptionOfferId: string | null = data.subscriptionOfferId;
  const logoAssetId: string | null = data.logoAssetId;
  const logoUploadToken: string | null = data.logoUploadToken;
  const menuAssetId: string | null = data.menuAssetId;
  const menuUploadToken: string | null = data.menuUploadToken;

  if (subscriptionOfferId === null) {
    throw new Error("The package is not selected");
  }

  if (logoAssetId === null || logoUploadToken === null || menuAssetId === null || menuUploadToken === null) {
    throw new Error("The uploads are not confirmed yet");
  }

  const branches: OnboardingBranchPayload[] = data.branches.map((branch, index) => {
    if (branch.latitude === null || branch.longitude === null) {
      throw new Error("A branch has no location");
    }

    return {
      name: branch.name.trim(),
      // TODO: the branch form has no phone yet, so the owner phone is sent for now.
      phone: data.owner.phone.trim(),
      addressLine1: branch.address.trim(),
      addressLine2: null,
      city: null,
      region: null,
      countryCode: DEFAULT_COUNTRY_CODE,
      postalCode: null,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isPrimary: index === 0,
      sortOrder: index,
      // TODO: map openingTime and closingTime once the DayOfWeek format is confirmed.
      workingHours: null,
    };
  });

  return {
    restaurantNameEn: data.restaurantNameEn.trim(),
    restaurantNameAr: data.restaurantNameAr.trim(),
    ownerFullName: data.owner.fullName.trim(),
    ownerEmail: data.owner.email.trim(),
    ownerPhone: data.owner.phone.trim(),
    subscriptionOfferId,
    logoAssetId,
    logoUploadToken,
    menuAssetId,
    menuUploadToken,
    branches,
  };
}

/** Reads the request id of a successful response. */
function readRequestId(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (data !== null && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.requestId === "string") {
      return record.requestId;
    }

    if (typeof record.id === "string") {
      return record.id;
    }
  }

  return "";
}

/** Sends the registration. The caller owns the key, so a retry of the same attempt reuses it. */
export async function submitOnboardingRequest(data: RegisterData, idempotencyKey: string): Promise<SubmitResult> {
  const raw: unknown = await apiPost<unknown>(ONBOARDING_PATH, buildOnboardingPayload(data), {
    "Idempotency-Key": idempotencyKey,
  });
  const requestId: string = readRequestId(raw);

  if (requestId === "") {
    throw new ApiError("server", "The backend did not return a request id");
  }

  return { requestId };
}

/** The form field of one backend field name, or null when the name is not known. */
function mapFieldName(name: string): string | null {
  if (name === "restaurantNameAr" || name === "restaurantNameEn" || name === "subscriptionOfferId") {
    return name;
  }

  if (name === "ownerFullName") return "owner.fullName";
  if (name === "ownerEmail") return "owner.email";
  if (name === "ownerPhone") return "owner.phone";

  const normalized: string = name.replace(/\[(\d+)\]/g, ".$1");
  const branchMatch: RegExpExecArray | null = /^branches?\.(\d+)\.([A-Za-z0-9]+)$/.exec(normalized);

  if (branchMatch !== null) {
    const index: string = branchMatch[1];
    const property: string = branchMatch[2];

    if (property === "name") return `branches.${index}.name`;
    if (property === "addressLine1") return `branches.${index}.address`;
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

/** Turns the backend errors into form field errors. Unknown fields are left out. */
export function mapServerFieldErrors(errors: unknown): StepErrors {
  const mapped: StepErrors = {};

  const add = (name: string, message: string): void => {
    const field: string | null = mapFieldName(name);

    if (field !== null && message !== "" && mapped[field] === undefined) {
      mapped[field] = message;
    }
  };

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (item === null || typeof item !== "object") continue;

      const record = item as Record<string, unknown>;
      const name: unknown = record.field ?? record.property ?? record.name;
      const message: string = firstMessage(record.message ?? record.error);

      if (typeof name === "string") {
        add(name, message);
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
