import "server-only";

// This file talks to Paymob (Intention API). Secrets stay on the server only.
import { createHmac, timingSafeEqual } from "node:crypto";
import { PLANS, getMonthlyPrice } from "@/lib/constants";
import type { BillingCycle } from "@/lib/types";

type PaymobConfig = {
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  integrationIds: number[];
  appUrl: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getPaymobConfig(): PaymobConfig {
  const secretKey = getEnv("PAYMOB_SECRET_KEY");
  const publicKey = getEnv("PAYMOB_PUBLIC_KEY");
  const hmacSecret = getEnv("PAYMOB_HMAC_SECRET");
  const integrationIdsRaw = getEnv("PAYMOB_INTEGRATION_IDS");
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL");

  const integrationIds = integrationIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  return { secretKey, publicKey, hmacSecret, integrationIds, appUrl };
}

export type Billing = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

type IntentionParams = {
  amountCents: number;
  merchantOrderId: string;
  billing: Billing;
  integrationIds: number[];
  planName: string;
  billingCycle: BillingCycle;
};

/** Creates a Paymob intention and returns its client secret. */
export async function createIntention(params: IntentionParams): Promise<string> {
  const config = getPaymobConfig();

  const body = {
    amount: params.amountCents,
    currency: "EGP",
    payment_methods: params.integrationIds,
    items: [
      {
        name: params.planName,
        amount: params.amountCents,
        description: params.billingCycle,
        quantity: 1,
      },
    ],
    billing_data: {
      first_name: params.billing.first_name,
      last_name: params.billing.last_name,
      email: params.billing.email,
      phone_number: params.billing.phone_number,
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      shipping_method: "NA",
      postal_code: "NA",
      city: "Cairo",
      country: "EG",
      state: "NA",
    },
    special_reference: params.merchantOrderId,
    notification_url: `${config.appUrl}/api/payment/webhook`,
    redirection_url: `${config.appUrl}/payment/result`,
  };

  const response = await fetch("https://accept.paymob.com/v1/intention/", {
    method: "POST",
    headers: {
      Authorization: `Token ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let paymobMessage = "Paymob request failed";
    try {
      const json = (await response.json()) as { message?: string; detail?: string };
      paymobMessage = json.message ?? json.detail ?? paymobMessage;
    } catch {
      // Keep the generic message when Paymob does not return JSON.
    }
    throw new Error(`Paymob error ${response.status}: ${paymobMessage}`);
  }

  const json = (await response.json()) as { client_secret?: string };
  if (json.client_secret === undefined || json.client_secret === "") {
    throw new Error("Paymob error: missing client_secret");
  }

  return json.client_secret;
}

/** Builds the Paymob Unified Checkout URL for a client secret. */
export function buildCheckoutUrl(clientSecret: string): string {
  const publicKey = getEnv("PAYMOB_PUBLIC_KEY");
  return `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;
}

/** Computes the plan amount in cents on the server only. */
export function getPlanAmountCents(planId: string, billingCycle: BillingCycle): number {
  const plan = PLANS.find((item) => item.id === planId);
  if (plan === undefined) {
    throw new Error("Invalid plan");
  }

  const amount = billingCycle === "monthly" ? getMonthlyPrice(plan.yearlyPrice) : plan.yearlyPrice;
  return amount * 100;
}

const HMAC_FIELDS: string[] = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

function readField(obj: Record<string, unknown>, path: string): string {
  let current: unknown = obj;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return "";
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current === null || current === undefined ? "" : String(current);
}

/** Verifies Paymob's HMAC-SHA512 signature for a transaction object. */
export function verifyHmac(obj: Record<string, unknown>, receivedHmac: string): boolean {
  if (receivedHmac === "") {
    return false;
  }

  const hmacSecret = getEnv("PAYMOB_HMAC_SECRET");
  const concatenated = HMAC_FIELDS.map((field) => readField(obj, field)).join("");
  const expected = createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(receivedHmac.trim().toLowerCase(), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
