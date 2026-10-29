// This file builds the onboarding request body and sends it to the backend.

import { ApiError, apiPost } from "./client";
import type {
  OnboardingBranchPayload,
  OnboardingSubmitPayload,
  RegisterData,
  SubmitResult,
} from "@/lib/types";

const ONBOARDING_PATH = "/api/v1/onboarding-requests";

/** Builds the body of the registration request. */
export function buildOnboardingPayload(data: RegisterData): OnboardingSubmitPayload {
  const subscriptionOfferId: string | null = data.subscriptionOfferId;
  const logoAssetId: string | null = data.logoAssetId;
  const menuAssetId: string | null = data.menuAssetId;

  if (subscriptionOfferId === null) {
    throw new Error("The package is not selected");
  }

  if (logoAssetId === null || menuAssetId === null) {
    throw new Error("The uploads are not confirmed yet");
  }

  const branches: OnboardingBranchPayload[] = data.branches.map((branch, index) => {
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
