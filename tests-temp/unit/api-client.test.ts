// Unit tests for the backend HTTP client (lib/api/client.ts), with fetch mocked.

import { beforeEach, afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, apiGet, apiPost, apiPostForm, apiPutFile } from "../../lib/api/client";

type FetchCall = { url: string; init?: RequestInit };

const ORIGINAL_BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL;
const originalFetch: typeof fetch = globalThis.fetch;
let calls: FetchCall[] = [];

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): void {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url: string = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
}

function envelope(value: unknown, overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      statusCode: 200,
      isSuccess: true,
      data: value,
      errors: null,
      timestamp: "2026-10-31T00:00:00Z",
      ...overrides,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function jsonResponse(value: unknown, status: number): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/";
});

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (ORIGINAL_BASE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_BASE_URL;
  }
});

describe("configuration", () => {
  test("throws missing_config when the base URL is missing or blank", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    await assert.rejects(apiGet("/anything"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "missing_config");
      return true;
    });

    process.env.NEXT_PUBLIC_API_BASE_URL = "   ";

    await assert.rejects(apiGet("/anything"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "missing_config");
      return true;
    });
  });

  test("joins the path and strips trailing slashes from the base URL", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test///";
    mockFetch(() => envelope({ ok: true }));

    await apiGet("/api/v1/test");

    assert.equal(calls[0].url, "https://api.example.test/api/v1/test");
  });
});

describe("apiGet and apiPost", () => {
  test("unwraps the data of a successful envelope", async () => {
    mockFetch(() => envelope({ value: 42 }));

    const result = await apiGet<{ value: number }>("/api/v1/value");

    assert.deepEqual(result, { value: 42 });
    assert.equal(calls[0].init?.method, "GET");
    assert.deepEqual(calls[0].init?.headers, { Accept: "application/json" });
  });

  test("POSTs a JSON body with the JSON content type and extra headers", async () => {
    mockFetch(() => envelope({ created: true }));

    const body: { name: string } = { name: "Test" };
    await apiPost<{ created: boolean }>("/api/v1/create", body, { "X-Test": "1" });

    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.body, JSON.stringify(body));
    assert.deepEqual(calls[0].init?.headers, {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Test": "1",
    });
  });

  test("POSTs multipart form data without setting a content type", async () => {
    mockFetch(() => envelope({ ok: true }));

    const form = new FormData();
    form.append("image", new File(["x"], "menu.png", { type: "image/png" }));
    await apiPostForm("/api/v1/upload", form, 5_000);

    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.body, form);
    assert.deepEqual(calls[0].init?.headers, { Accept: "application/json" });
    assert.equal(calls[0].init?.signal instanceof AbortSignal, true);
  });

  test("turns an unsuccessful envelope into a server ApiError", async () => {
    mockFetch(() =>
      envelope(null, {
        statusCode: 422,
        isSuccess: false,
        errors: [{ field: "name", message: "Name is invalid" }],
      }),
    );

    await assert.rejects(apiGet("/api/v1/bad"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "server");
      assert.equal(error.status, 422);
      assert.equal(error.message, "Name is invalid");
      assert.deepEqual(error.errors, [{ field: "name", message: "Name is invalid" }]);
      return true;
    });
  });

  test("uses the first string error of the envelope", async () => {
    mockFetch(() =>
      envelope(null, { statusCode: 400, isSuccess: false, errors: ["", "First error", "Second error"] }),
    );

    await assert.rejects(apiGet("/api/v1/bad"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "First error");
      return true;
    });
  });

  test("falls back to the HTTP status when the body is not JSON", async () => {
    mockFetch(() => new Response("not json", { status: 500 }));

    await assert.rejects(apiGet("/api/v1/bad"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "server");
      assert.equal(error.status, 500);
      assert.equal(error.message, "Request failed with status 500");
      return true;
    });
  });

  test("treats isSuccess false even when the HTTP status is 200", async () => {
    mockFetch(() => jsonResponse({ statusCode: 409, isSuccess: false, data: null, errors: "Conflict", timestamp: "" }, 200));

    await assert.rejects(apiGet("/api/v1/bad"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "server");
      assert.equal(error.status, 409);
      assert.equal(error.message, "Conflict");
      return true;
    });
  });

  test("turns a rejected fetch into a network ApiError", async () => {
    mockFetch(() => Promise.reject(new Error("offline")));

    await assert.rejects(apiGet("/api/v1/value"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "network");
      assert.equal(error.status, null);
      return true;
    });
  });

  test("turns an aborted request into a timeout ApiError", async () => {
    mockFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    await assert.rejects(apiPostForm("/api/v1/slow", new FormData(), 20), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "timeout");
      return true;
    });
  });
});

describe("apiPutFile", () => {
  test("PUTs the file with only the exact content type", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    const file = new File(["data"], "logo.png", { type: "image/png" });

    await apiPutFile("https://storage.example.test/upload", file, "image/png");

    assert.equal(calls[0].url, "https://storage.example.test/upload");
    assert.equal(calls[0].init?.method, "PUT");
    assert.equal(calls[0].init?.body, file);
    assert.deepEqual(calls[0].init?.headers, { "Content-Type": "image/png" });
  });

  test("accepts a 200 response", async () => {
    mockFetch(() => new Response(null, { status: 200 }));
    const file = new File(["data"], "logo.png", { type: "image/png" });

    await apiPutFile("https://storage.example.test/upload", file, "image/png");
  });

  test("throws a server ApiError for a rejected upload", async () => {
    mockFetch(() => new Response("denied", { status: 403 }));
    const file = new File(["data"], "logo.png", { type: "image/png" });

    await assert.rejects(apiPutFile("https://storage.example.test/upload", file, "image/png"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "server");
      assert.equal(error.status, 403);
      return true;
    });
  });

  test("throws a network ApiError when the storage is unreachable", async () => {
    mockFetch(() => Promise.reject(new Error("offline")));
    const file = new File(["data"], "logo.png", { type: "image/png" });

    await assert.rejects(apiPutFile("https://storage.example.test/upload", file, "image/png"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, "network");
      return true;
    });
  });
});
