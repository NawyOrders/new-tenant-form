// This file is the only place that talks to the backend over HTTP.
//
// TODO: the swagger applies Bearer globally. Confirm which endpoints need a token before sending one.

import type { ApiEnvelope, ApiErrorKind } from "./types";

/** The timeout of one request, in milliseconds. */
const TIMEOUT_MS = 10_000;

/** The error thrown by every API call. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
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

/** GETs one path from the backend and returns the unwrapped data. */
export async function apiGet<T>(path: string): Promise<T> {
  const url: string = `${getBaseUrl()}${path}`;
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response: Response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
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

      throw new ApiError("server", message !== "" ? message : fallback, status);
    }

    return envelope.data;
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
