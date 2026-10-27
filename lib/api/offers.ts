// This file reads the active subscription offers of the package step.

import { apiGet } from "./client";
import type { ActiveSubscriptionOffer } from "@/lib/types";

const OFFERS_PATH = "/api/v1/onboarding-requests/offers";

/** Turns one backend item into an offer, or null when a required field is missing. */
function toOffer(value: unknown): ActiveSubscriptionOffer | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    item.id === "" ||
    typeof item.packageCode !== "string" ||
    item.packageCode === "" ||
    typeof item.durationMonths !== "number" ||
    !Number.isFinite(item.durationMonths) ||
    typeof item.price !== "number" ||
    !Number.isFinite(item.price)
  ) {
    return null;
  }

  return {
    id: item.id,
    packageCode: item.packageCode,
    termCode: typeof item.termCode === "string" ? item.termCode : null,
    durationMonths: item.durationMonths,
    price: item.price,
    currency: typeof item.currency === "string" ? item.currency : "",
  };
}

/** Loads the active subscription offers. Invalid items are dropped. */
export async function getOffers(): Promise<ActiveSubscriptionOffer[]> {
  const data: unknown = await apiGet<unknown>(OFFERS_PATH);
  const items: unknown[] = Array.isArray(data) ? data : [];
  const offers: ActiveSubscriptionOffer[] = [];
  let dropped = 0;

  for (const item of items) {
    const offer: ActiveSubscriptionOffer | null = toOffer(item);

    if (offer === null) {
      dropped += 1;
    } else {
      offers.push(offer);
    }
  }

  if (dropped > 0 && process.env.NODE_ENV !== "production") {
    console.warn(`[offers] Dropped ${dropped} invalid offer(s) from the backend response.`);
  }

  return offers;
}
