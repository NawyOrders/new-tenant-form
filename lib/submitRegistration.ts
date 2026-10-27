// This file is a MOCK of the real registration submit.
// There is NO backend yet: the function only waits a moment and returns a fake success.
//
// The logo and the menu are NOT sent anywhere yet: they will be sent as multipart parts
// of the same request when the backend is ready (see the payload below).

import type { RegisterData, SubmitPayload, SubmitResult } from "./types";

/** Set this to true to try the error screen of the wizard. */
export const MOCK_FORCE_ERROR = false;

/** The fake delay of the mock submit, in milliseconds. */
const MOCK_DELAY_MS = 900;

/** Builds the body that will be sent to the backend when it is ready. */
export function buildSubmitPayload(data: RegisterData): SubmitPayload {
  const subscriptionOfferId: string | null = data.subscriptionOfferId;

  if (subscriptionOfferId === null) {
    throw new Error("The package is not selected");
  }

  return {
    restaurant: { name: data.restaurantName.trim() },
    owner: {
      fullName: data.owner.fullName.trim(),
      phone: data.owner.phone.trim(),
      email: data.owner.email.trim(),
    },
    brand: {
      primaryColor: data.brand.primaryColor,
      backgroundColor: data.brand.backgroundColor,
      accentColor: data.brand.accentColor.trim() === "" ? null : data.brand.accentColor,
    },
    branches: data.branches.map((branch) => ({
      name: branch.name.trim(),
      address: branch.address.trim(),
      latitude: branch.latitude,
      longitude: branch.longitude,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
    })),
    package: {
      subscriptionOfferId,
    },
  };
}

/** Sends the registration. MOCK: nothing leaves the browser. */
export async function submitRegistration(data: RegisterData): Promise<SubmitResult> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

  if (MOCK_FORCE_ERROR) {
    throw new Error("mock error");
  }

  const payload: SubmitPayload = buildSubmitPayload(data);

  return {
    success: true,
    referenceId: `NW-${payload.restaurant.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
  };
}
