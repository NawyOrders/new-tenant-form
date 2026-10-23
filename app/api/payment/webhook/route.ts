// This route handles Paymob webhook callbacks and verifies their HMAC.
import "server-only";

import { NextResponse } from "next/server";
import { verifyHmac } from "@/lib/payment/paymob";

type WebhookBody = {
  type?: unknown;
  obj?: unknown;
};

function readId(obj: Record<string, unknown>): string {
  const order = obj["order"];
  if (order !== null && typeof order === "object") {
    const id = (order as Record<string, unknown>)["id"];
    if (id !== undefined && id !== null) {
      return String(id);
    }
  }
  return "NA";
}

export async function POST(request: Request): Promise<NextResponse> {
  const hmac = new URL(request.url).searchParams.get("hmac") ?? "";

  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = body.obj;
  if (obj === null || typeof obj !== "object") {
    return NextResponse.json({ error: "Missing transaction object" }, { status: 400 });
  }

  const transaction = obj as Record<string, unknown>;

  let isValid = false;
  try {
    isValid = verifyHmac(transaction, hmac);
  } catch {
    return NextResponse.json({ error: "Payment verification is not configured" }, { status: 500 });
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
  }

  if (transaction["success"] === true) {
    const orderId = readId(transaction);
    const transactionId = transaction["id"] === undefined ? "NA" : String(transaction["id"]);
    // Only the ids are logged, never personal data or secrets.
    console.log(`Paymob payment success: order=${orderId} transaction=${transactionId}`);
    // TODO: save the registration after a successful payment (next task).
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
