// Unit tests for the offers loader (lib/api/offers.ts), with fetch mocked.

import { beforeEach, afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { getOffers } from "../../lib/api/offers";

type FetchCall = { url: string; init?: RequestInit };

const ORIGINAL_BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL;
const originalFetch: typeof fetch = globalThis.fetch;
const originalWarn: typeof console.warn = console.warn;
let calls: FetchCall[] = [];
let warnings: string[] = [];

function mockOffers(data: unknown): void {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url: string = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });

    return new Response(
      JSON.stringify({
        statusCode: 200,
        isSuccess: true,
        data,
        errors: null,
        timestamp: "2026-10-31T00:00:00Z",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
}

beforeEach(() => {
  calls = [];
  warnings = [];
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.map((arg) => String(arg)).join(" "));
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;

  if (ORIGINAL_BASE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_BASE_URL;
  }
});

describe("getOffers", () => {
  test("calls the offers endpoint and maps every valid item", async () => {
    mockOffers([
      {
        id: "offer-1",
        packageCode: "starter",
        termCode: "3m",
        durationMonths: 3,
        price: 1500,
        currency: "EGP",
      },
      {
        id: "offer-2",
        packageCode: "growth",
        durationMonths: 6,
        price: 2500,
      },
    ]);

    const offers = await getOffers();

    assert.equal(calls[0].url, "https://api.example.test/api/v1/onboarding-requests/offers");
    assert.equal(calls[0].init?.method, "GET");
    assert.deepEqual(offers, [
      {
        id: "offer-1",
        packageCode: "starter",
        termCode: "3m",
        durationMonths: 3,
        price: 1500,
        currency: "EGP",
      },
      {
        id: "offer-2",
        packageCode: "growth",
        termCode: null,
        durationMonths: 6,
        price: 2500,
        currency: "",
      },
    ]);
    assert.deepEqual(warnings, []);
  });

  test("drops invalid items and warns outside production", async () => {
    mockOffers([
      { id: "ok", packageCode: "starter", durationMonths: 3, price: 100, currency: "EGP" },
      { id: "", packageCode: "starter", durationMonths: 3, price: 100 },
      { id: "no-package", durationMonths: 3, price: 100 },
      { id: "bad-duration", packageCode: "starter", durationMonths: "3", price: 100 },
      { id: "bad-price", packageCode: "starter", durationMonths: 3, price: Number.NaN },
      null,
      "text",
    ]);

    const offers = await getOffers();

    assert.equal(offers.length, 1);
    assert.equal(offers[0].id, "ok");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Dropped 6 invalid offer\(s\)/);
  });

  test("returns an empty list when the data is not an array", async () => {
    mockOffers({ items: [] });

    assert.deepEqual(await getOffers(), []);
  });

  test("returns an empty list when the backend sends no data", async () => {
    mockOffers(null);

    assert.deepEqual(await getOffers(), []);
  });
});
