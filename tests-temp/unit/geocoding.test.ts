// Unit tests for the Nominatim client (lib/geocoding.ts), with fetch mocked.

import { beforeEach, afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { reverseGeocode, searchAddress } from "../../lib/geocoding";

type FetchCall = { url: string; init?: RequestInit };

const originalFetch: typeof fetch = globalThis.fetch;
let calls: FetchCall[] = [];

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): void {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url: string = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("searchAddress", () => {
  test("builds the Nominatim search URL and returns a rounded result", async () => {
    mockFetch(() =>
      jsonResponse([
        {
          lat: "31.200123456",
          lon: "29.9187654321",
          display_name: "12 Test Street, Cairo, Egypt",
          address: {
            city: "Cairo",
            state: "Cairo Governorate",
            postcode: "11511",
            country_code: "eg",
          },
        },
      ]),
    );

    const result = await searchAddress("12 Test Street", "ar");

    assert.notEqual(result, null);
    assert.equal(result?.latitude, 31.200123);
    assert.equal(result?.longitude, 29.918765);
    assert.equal(result?.displayName, "12 Test Street, Cairo, Egypt");
    assert.deepEqual(result?.addressParts, {
      city: "Cairo",
      region: "Cairo Governorate",
      postalCode: "11511",
      countryCode: "EG",
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^https:\/\/nominatim\.openstreetmap\.org\/search\?/);
    assert.match(calls[0].url, /format=jsonv2/);
    assert.match(calls[0].url, /addressdetails=1/);
    assert.match(calls[0].url, /q=12%20Test%20Street/);
    assert.match(calls[0].url, /countrycodes=eg/);
    assert.match(calls[0].url, /accept-language=ar/);
    assert.match(calls[0].url, /limit=1$/);
    assert.deepEqual(calls[0].init?.headers, { Accept: "application/json" });
  });

  test("falls back through town, village and city_district for the city", async () => {
    mockFetch(() =>
      jsonResponse([
        {
          lat: "31.1",
          lon: "29.9",
          display_name: "Somewhere",
          address: { town: "Town", state: "Region" },
        },
      ]),
    );

    const first = await searchAddress("a", "en");
    assert.equal(first?.addressParts?.city, "Town");

    mockFetch(() =>
      jsonResponse([
        {
          lat: "31.1",
          lon: "29.9",
          display_name: "Somewhere",
          address: { village: "Village" },
        },
      ]),
    );
    const second = await searchAddress("b", "en");
    assert.equal(second?.addressParts?.city, "Village");

    mockFetch(() =>
      jsonResponse([
        {
          lat: "31.1",
          lon: "29.9",
          display_name: "Somewhere",
          address: { city_district: "District" },
        },
      ]),
    );
    const third = await searchAddress("c", "en");
    assert.equal(third?.addressParts?.city, "District");
  });

  test("leaves missing address parts null and omits the parts when no address is sent", async () => {
    mockFetch(() =>
      jsonResponse([{ lat: "31.1", lon: "29.9", display_name: "Somewhere", address: {} }]),
    );
    const withEmptyAddress = await searchAddress("q", "en");
    assert.deepEqual(withEmptyAddress?.addressParts, {
      city: null,
      region: null,
      postalCode: null,
      countryCode: null,
    });

    mockFetch(() => jsonResponse([{ lat: "31.1", lon: "29.9", display_name: "Somewhere" }]));
    const withoutAddress = await searchAddress("q", "en");
    assert.equal(withoutAddress?.addressParts, undefined);
  });

  test("returns null for empty, malformed and failed responses", async () => {
    mockFetch(() => jsonResponse([]));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => jsonResponse({ not: "an array" }));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => jsonResponse([{ lat: "not-a-number", lon: "29.9", display_name: "X" }]));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => jsonResponse([{ lat: "31.1", lon: "29.9" }]));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => new Response("server error", { status: 500 }));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => new Response("not json", { status: 200 }));
    assert.equal(await searchAddress("nothing", "en"), null);

    mockFetch(() => Promise.reject(new Error("offline")));
    assert.equal(await searchAddress("nothing", "en"), null);
  });

  test("forwards the abort signal", async () => {
    mockFetch(() => jsonResponse([]));
    const controller = new AbortController();

    await searchAddress("q", "en", controller.signal);

    assert.equal(calls[0].init?.signal, controller.signal);
  });
});

describe("reverseGeocode", () => {
  test("builds the reverse URL and returns the display name and parts", async () => {
    mockFetch(() =>
      jsonResponse({
        display_name: "12 Test Street, Cairo, Egypt",
        address: { city: "Cairo", state: "Cairo", postcode: "11511", country_code: "eg" },
      }),
    );

    const result = await reverseGeocode(31.2, 29.9, "en");

    assert.equal(result?.displayName, "12 Test Street, Cairo, Egypt");
    assert.deepEqual(result?.addressParts, {
      city: "Cairo",
      region: "Cairo",
      postalCode: "11511",
      countryCode: "EG",
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^https:\/\/nominatim\.openstreetmap\.org\/reverse\?/);
    assert.match(calls[0].url, /format=jsonv2/);
    assert.match(calls[0].url, /addressdetails=1/);
    assert.match(calls[0].url, /lat=31\.2/);
    assert.match(calls[0].url, /lon=29\.9/);
    assert.match(calls[0].url, /accept-language=en/);
  });

  test("returns null when the display name is missing, empty or the call fails", async () => {
    mockFetch(() => jsonResponse({}));
    assert.equal(await reverseGeocode(31.2, 29.9, "en"), null);

    mockFetch(() => jsonResponse({ display_name: "" }));
    assert.equal(await reverseGeocode(31.2, 29.9, "en"), null);

    mockFetch(() => new Response("nope", { status: 404 }));
    assert.equal(await reverseGeocode(31.2, 29.9, "en"), null);

    mockFetch(() => Promise.reject(new Error("offline")));
    assert.equal(await reverseGeocode(31.2, 29.9, "en"), null);
  });

  test("keeps the address parts undefined when the service sends no address", async () => {
    mockFetch(() => jsonResponse({ display_name: "Somewhere" }));

    const result = await reverseGeocode(31.2, 29.9, "en");

    assert.equal(result?.addressParts, undefined);
  });
});
