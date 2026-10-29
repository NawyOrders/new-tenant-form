// This file talks to the menu OCR endpoints: it sends the menu picture, reads the job status
// with its Retry-After header, and reads the extracted items when the job is done.
//
// TODO: the plan document describes a value/error envelope for these endpoints. Confirm with
// the backend that they use the same { statusCode, isSuccess, data, errors, timestamp } wrapper
// as the other onboarding calls.

import { ApiError, apiGetWithHeaders, apiPostForm } from "./client";
import type { ApiResult } from "./client";

const MENU_OCR_PATH = "/api/v1/onboarding/menu-ocr";
const JOBS_PATH = "/api/v1/ai/jobs";
const SUBMIT_TIMEOUT_MS = 30_000;
const POLL_TIMEOUT_MS = 10_000;

/** The biggest menu picture the OCR endpoint accepts. */
export const MENU_OCR_MAX_BYTES = 15 * 1024 * 1024;

/** The picture types the OCR endpoint accepts. */
export const MENU_OCR_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];

/** The job the backend started for one menu. */
export type MenuOcrJob = {
  jobId: string;
};

/** The states a job can be in. */
export type OcrJobState =
  | "Queued"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Cancelled"
  | "Expired"
  | "Unknown";

/** One status read of a running job. */
export type OcrJobStatus = {
  status: OcrJobState;
  progressPercentage: number | null;
  stage: string | null;
  errorMessage: string | null;
  /** The wait before the next read, read from the Retry-After header. */
  retryAfterMs: number | null;
};

/** One extracted item of the menu. */
export type OcrMenuItem = {
  nameAr: string;
  nameEn: string;
  price: number | null;
  currency: string | null;
};

/** One extracted category of the menu. */
export type OcrCategory = {
  nameAr: string;
  nameEn: string;
  items: OcrMenuItem[];
};

/** The result of a finished job. */
export type OcrResult = {
  categories: OcrCategory[];
  requiresReview: boolean;
  stats: Record<string, number> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Reads Retry-After, which can be a number of seconds or a date. */
function parseRetryAfter(headers: Headers): number | null {
  const raw: string | null = headers.get("Retry-After");

  if (raw === null || raw.trim() === "") {
    return null;
  }

  const seconds: number = Number(raw);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date: number = Date.parse(raw);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

function toJobState(value: string | null): OcrJobState {
  const known: OcrJobState[] = ["Queued", "Processing", "Completed", "Failed", "Cancelled", "Expired"];
  const found = known.find((state) => state.toLowerCase() === (value ?? "").toLowerCase());

  return found ?? "Unknown";
}

function toItem(value: unknown): OcrMenuItem | null {
  const item = asRecord(value);

  if (item === null) {
    return null;
  }

  return {
    nameAr: asString(item.nameAr) ?? "",
    nameEn: asString(item.nameEn) ?? "",
    price: asNumber(item.price),
    currency: asString(item.currency),
  };
}

function toCategory(value: unknown): OcrCategory | null {
  const category = asRecord(value);

  if (category === null) {
    return null;
  }

  const rawItems: unknown[] = Array.isArray(category.items) ? category.items : [];
  const items: OcrMenuItem[] = rawItems
    .map(toItem)
    .filter((item): item is OcrMenuItem => item !== null);

  return {
    nameAr: asString(category.nameAr) ?? "",
    nameEn: asString(category.nameEn) ?? "",
    items,
  };
}

/** Sends one menu picture and returns the started job. */
export async function submitMenuOcr(file: File): Promise<MenuOcrJob> {
  const form = new FormData();
  form.append("image", file);

  const data: unknown = await apiPostForm<unknown>(MENU_OCR_PATH, form, SUBMIT_TIMEOUT_MS);
  const record = asRecord(data);
  const jobId: string | null = record !== null ? asString(record.jobId) : null;

  if (jobId === null) {
    throw new ApiError("server", "The OCR response has no jobId");
  }

  return { jobId };
}

/** Reads one status of a running job, including the wait the backend asks for. */
export async function getJobStatus(jobId: string): Promise<OcrJobStatus> {
  const result: ApiResult<unknown> = await apiGetWithHeaders<unknown>(
    `${JOBS_PATH}/${encodeURIComponent(jobId)}/status`,
    POLL_TIMEOUT_MS,
  );
  const data = asRecord(result.data);

  if (data === null) {
    throw new ApiError("server", "The job status is empty");
  }

  return {
    status: toJobState(asString(data.status)),
    progressPercentage: asNumber(data.progressPercentage),
    stage: asString(data.stage),
    errorMessage: asString(data.errorMessage),
    retryAfterMs: parseRetryAfter(result.headers),
  };
}

/** Reads the items of a finished job. */
export async function getJobResult(jobId: string): Promise<OcrResult> {
  const result: ApiResult<unknown> = await apiGetWithHeaders<unknown>(
    `${JOBS_PATH}/${encodeURIComponent(jobId)}/result`,
    POLL_TIMEOUT_MS,
  );
  const record = asRecord(result.data);

  if (record === null) {
    throw new ApiError("server", "The job result is empty");
  }

  const rawCategories: unknown[] = Array.isArray(record.categories) ? record.categories : [];
  const categories: OcrCategory[] = rawCategories
    .map(toCategory)
    .filter((category): category is OcrCategory => category !== null);
  const statsRecord = asRecord(record.stats);
  const stats: Record<string, number> | null =
    statsRecord === null
      ? null
      : Object.fromEntries(
          Object.entries(statsRecord).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
        );

  return {
    categories,
    requiresReview: record.requiresReview === true,
    stats,
  };
}
