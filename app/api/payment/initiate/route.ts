// This route initiates a Paymob payment. The amount is computed on the server only.
import "server-only";

import { NextResponse } from "next/server";
import {
  buildCheckoutUrl,
  createIntention,
  getPaymobConfig,
  getPlanAmountCents,
} from "@/lib/payment/paymob";
import { PLANS } from "@/lib/constants";
import { isValidEgyptianPhone, isValidEmail } from "@/lib/validation";
import type { BillingCycle } from "@/lib/types";

type InitiateBody = {
  planId?: unknown;
  billingCycle?: unknown;
  ownerName?: unknown;
  email?: unknown;
  phone?: unknown;
  merchantOrderId?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function splitOwnerName(ownerName: string): { first_name: string; last_name: string } {
  const parts = ownerName.trim().split(/\s+/);
  if (parts.length < 2) {
    return { first_name: parts[0] ?? "NA", last_name: "NA" };
  }
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: InitiateBody;
  try {
    body = (await request.json()) as InitiateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { planId, billingCycle, ownerName, email, phone, merchantOrderId } = body;

  if (
    !isNonEmptyString(planId) ||
    !isNonEmptyString(billingCycle) ||
    !isNonEmptyString(ownerName) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(merchantOrderId)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (billingCycle !== "monthly" && billingCycle !== "yearly") {
    return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
  }

  const cycle: BillingCycle = billingCycle;
  const plan = PLANS.find((item) => item.id === planId);
  if (plan === undefined) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!isValidEgyptianPhone(phone)) {
    return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
  }

  let integrationIds: number[];
  try {
    integrationIds = getPaymobConfig().integrationIds;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Missing environment variable";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const amountCents = getPlanAmountCents(planId, cycle);
    const billing = splitOwnerName(ownerName);

    const clientSecret = await createIntention({
      amountCents,
      merchantOrderId,
      billing: {
        first_name: billing.first_name,
        last_name: billing.last_name,
        email,
        phone_number: phone,
      },
      integrationIds,
      planName: plan.name.en,
      billingCycle: cycle,
    });

    return NextResponse.json({ checkoutUrl: buildCheckoutUrl(clientSecret) }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment could not be started";
    if (message.startsWith("Missing environment variable")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
