// This file builds the onboarding request body and sends it to the backend.

import { WORKING_DAY_CODES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n";
import { isValidSubdomain } from "@/lib/validation";
import { ApiError, apiGet, apiPost } from "./client";
import type {
  Branch,
  OnboardingBranchPayload,
  OnboardingSubmitPayload,
  RegisterData,
  SubdomainAvailability,
  SubmitResult,
} from "@/lib/types";

const ONBOARDING_PATH = "/api/v1/onboarding-requests";
const SUBDOMAIN_AVAILABILITY_PATH = "/api/v1/onboarding-requests/subdomain-availability";

/** The message key of one reason value the backend sends for a taken subdomain. */
export function subdomainReasonKey(reason: string | null): TranslationKey {
  if (reason === "reserved") {
    return "subdomain.reserved";
  }

  if (reason === "invalid") {
    return "subdomain.invalid";
  }

  return "subdomain.taken";
}

/** Reads the availability answer, and stops when the backend sends an incomplete one. */
function readAvailability(data: unknown): SubdomainAvailability {
  if (data !== null && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.subdomain === "string" && typeof record.available === "boolean") {
      return {
        subdomain: record.subdomain,
        available: record.available,
        reason: typeof record.reason === "string" ? record.reason : null,
      };
    }
  }

  throw new ApiError("server", "The subdomain availability response is incomplete");
}

/** Asks the backend whether one subdomain is free. The caller may abort when the value changes. */
export async function checkSubdomainAvailability(
  subdomain: string,
  signal?: AbortSignal,
): Promise<SubdomainAvailability> {
  const raw: unknown = await apiGet<unknown>(
    `${SUBDOMAIN_AVAILABILITY_PATH}?subdomain=${encodeURIComponent(subdomain)}`,
    signal,
  );

  return readAvailability(raw);
}

/** One working-hours row of a branch, for the backend. */
export type WorkingHoursEntry = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  closesNextDay: boolean;
};

type OnboardingBranchRequest = Omit<OnboardingBranchPayload, "workingHours"> & {
  workingHours: WorkingHoursEntry[];
};

type OnboardingRequest = Omit<OnboardingSubmitPayload, "branches"> & {
  branches: OnboardingBranchRequest[];
};

/** Keeps only "HH:mm", even if the time input includes seconds. */
function toHourMinute(value: string): string {
  const trimmed: string = value.trim();
  return trimmed.length > 5 ? trimmed.slice(0, 5) : trimmed;
}

/** Builds the same 7-day schedule from the single schedule the owner entered. */
export function buildWorkingHours(branch: Branch): WorkingHoursEntry[] {
  const openTime: string = toHourMinute(branch.openingTime);
  const closeTime: string = toHourMinute(branch.closingTime);

  if (openTime === "" || closeTime === "") {
    throw new Error("A branch has no opening hours");
  }

  // An earlier closing time means the branch closes after midnight.
  const closesNextDay: boolean = closeTime < openTime;

  return WORKING_DAY_CODES.map((dayOfWeek: number) => ({
    dayOfWeek,
    isClosed: false,
    openTime,
    closeTime,
    closesNextDay,
  }));
}

/** Builds the body of the registration request. */
export function buildOnboardingPayload(data: RegisterData): OnboardingRequest {
  const subscriptionOfferId: string | null = data.subscriptionOfferId;
  const logoAssetId: string | null = data.logoAssetId;
  const menuAssetId: string | null = data.menuAssetId;

  if (subscriptionOfferId === null) {
    throw new Error("The package is not selected");
  }

  if (logoAssetId === null || menuAssetId === null) {
    throw new Error("The uploads are not confirmed yet");
  }

  if (!isValidSubdomain(data.subdomain)) {
    throw new Error("The subdomain is not valid");
  }

  const branches: OnboardingBranchRequest[] = data.branches.map((branch, index) => {
    if (branch.latitude === null || branch.longitude === null) {
      throw new Error("A branch has no location");
    }

    const region: string = branch.region.trim();
    const postalCode: string = branch.postalCode.trim();

    return {
      name: branch.name.trim(),
      // TODO: the branch form has no phone yet, so the owner phone is sent for now.
      phone: data.owner.phone.trim(),
      addressLine1: branch.address.trim(),
      addressLine2: null,
      city: branch.city.trim(),
      region: region === "" ? null : region,
      countryCode: branch.countryCode,
      postalCode: postalCode === "" ? null : postalCode,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isPrimary: index === 0,
      sortOrder: index,
      workingHours: buildWorkingHours(branch),
    };
  });

  return {
    restaurantNameEn: data.restaurantNameEn.trim(),
    restaurantNameAr: data.restaurantNameAr.trim(),
    subdomain: data.subdomain,
    ownerFullName: data.owner.fullName.trim(),
    ownerEmail: data.owner.email.trim(),
    ownerPhone: data.owner.phone.trim(),
    subscriptionOfferId,
    logoAssetId,
    menuAssetId,
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
