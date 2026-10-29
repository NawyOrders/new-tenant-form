// This file is the only place that talks to the backend over HTTP.
//
// TODO: the swagger applies Bearer globally. Confirm which endpoints need a token before sending one.

import type { ApiEnvelope, ApiErrorKind } from "./types";

/** The timeout of one JSON request, in milliseconds. */
const TIMEOUT_MS = 10_000;

/** The timeout of one file upload, in milliseconds. */
const UPLOAD_TIMEOUT_MS = 60_000;

/** The error thrown by every API call. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** The raw errors of the response wrapper, used to map a 422 to the form fields. */
  readonly errors: unknown;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, errors: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.errors = errors;
  }
}

/** Reads the base URL, and fails loudly when it is missing. */
function getBaseUrl(): string {
  const baseUrl: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (baseUrl === undefined || baseUrl.trim() === "") {
    throw new ApiError("missing_config", "NEXT_PUBLIC_API_BASE_URL is not set");
  }

  return baseUrl.trim().replace(/\/+$/, "");
}

/** Reads the first error message of the wrapper, if there is one. */
function firstErrorMessage(errors: unknown): string {
  if (typeof errors === "string") {
    return errors;
  }

  if (!Array.isArray(errors)) {
    return "";
  }

  for (const item of errors) {
    if (typeof item === "string" && item !== "") {
      return item;
    }

    if (item !== null && typeof item === "object" && "message" in item) {
      const message: unknown = (item as { message: unknown }).message;
      if (typeof message === "string" && message !== "") {
        return message;
      }
    }
  }

  return "";
}

type SendOptions = {
  method: "GET" | "POST";
  body?: BodyInit;
  headers?: Record<string, string>;
  /** Overrides the default JSON timeout, for slow calls such as the logo palette. */
  timeoutMs?: number;
};

/** One response: the unwrapped data and the headers, which some polling calls read. */
export type ApiResult<T> = { data: T; headers: Headers };

/** Sends JSON to the backend and returns the unwrapped data of the wrapper. */
async function apiSend<T>(path: string, options: SendOptions): Promise<T> {
  const result: ApiResult<T> = await apiSendFull<T>(path, options);
  return result.data;
}

/** Sends one request and keeps the response headers beside the unwrapped data. */
async function apiSendFull<T>(path: string, options: SendOptions): Promise<ApiResult<T>> {
  const url: string = `${getBaseUrl()}${path}`;
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? TIMEOUT_MS,
  );

  try {
    const response: Response = await fetch(url, {
      method: options.method,
      headers: { Accept: "application/json", ...options.headers },
      body: options.body,
      signal: controller.signal,
    });

    let envelope: ApiEnvelope<T> | null = null;
    try {
      envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
      envelope = null;
    }

    if (!response.ok || envelope === null || envelope.isSuccess !== true) {
      const status: number = envelope !== null ? envelope.statusCode : response.status;
      const message: string = envelope !== null ? firstErrorMessage(envelope.errors) : "";
      const fallback: string = `Request failed with status ${response.status}`;

      throw new ApiError("server", message !== "" ? message : fallback, status, envelope !== null ? envelope.errors : null);
    }

    return { data: envelope.data, headers: response.headers };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiError("timeout", "The request timed out");
    }

    throw new ApiError("network", "The request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

/** GETs one path from the backend and returns the unwrapped data. */
export async function apiGet<T>(path: string): Promise<T> {
  return apiSend<T>(path, { method: "GET" });
}

/** GETs one path and keeps the response headers, which the OCR polling reads. */
export async function apiGetWithHeaders<T>(path: string, timeoutMs: number): Promise<ApiResult<T>> {
  return apiSendFull<T>(path, { method: "GET", timeoutMs });
}

/** POSTs a JSON body to the backend and returns the unwrapped data. */
export async function apiPost<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  return apiSend<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** POSTs multipart form data. No Content-Type is set here: the browser adds the boundary. */
export async function apiPostForm<T>(path: string, form: FormData, timeoutMs: number): Promise<T> {
  return apiSend<T>(path, { method: "POST", body: form, timeoutMs });
}

/** PUTs a raw file to an absolute upload URL (the storage does not use the response wrapper). */
export async function apiPutFile(uploadUrl: string, file: File, contentType: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    // Only Content-Type goes here: the storage signs it, and any extra header breaks the signature.
    const response: Response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
      signal: controller.signal,
    });

    if (response.status !== 200 && response.status !== 204) {
      throw new ApiError("server", `Upload failed with status ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiError("timeout", "The upload timed out");
    }

    throw new ApiError("network", "The upload failed");
  } finally {
    clearTimeout(timeoutId);
  }
}
