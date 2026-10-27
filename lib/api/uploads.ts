// This file talks to the onboarding upload endpoints: it asks for upload URLs, puts the
// file on the storage, and confirms the asset so the backend can use it.

import { ApiError, apiPost, apiPutFile } from "./client";
import type { UploadFileType, UploadRequestFile, UploadUrlItem } from "./types";

const UPLOAD_URLS_PATH = "/api/v1/onboarding-requests/upload-urls";
const ASSETS_PATH = "/api/v1/onboarding-requests/assets";

/** The kinds of the upload. TODO: verify this mapping with the backend. */
export const UPLOAD_TYPE_LOGO: UploadFileType = 1;
export const UPLOAD_TYPE_MENU: UploadFileType = 2;

/** Thrown when the chosen file is bigger than the backend allows. */
export class UploadTooLargeError extends Error {
  constructor() {
    super("The file is bigger than the allowed size");
    this.name = "UploadTooLargeError";
  }
}

/** Reads the upload slot, and stops with a clear message when a required part is missing. */
function toUploadUrlItem(value: unknown): UploadUrlItem {
  if (value === null || typeof value !== "object") {
    throw new ApiError("server", "The upload slot is not a valid object");
  }

  const item = value as Record<string, unknown>;
  const missing: string[] = [];

  if (typeof item.assetId !== "string" || item.assetId === "") missing.push("assetId");
  if (typeof item.uploadToken !== "string" || item.uploadToken === "") missing.push("uploadToken");
  if (typeof item.uploadUrl !== "string" || item.uploadUrl === "") missing.push("uploadUrl");
  if (typeof item.contentType !== "string" || item.contentType === "") missing.push("contentType");
  if (typeof item.maximumSizeBytes !== "number" || !Number.isFinite(item.maximumSizeBytes)) {
    missing.push("maximumSizeBytes");
  }

  if (missing.length > 0) {
    throw new ApiError("server", `The upload slot is missing ${missing.join(", ")}`);
  }

  return {
    assetId: item.assetId as string,
    uploadToken: item.uploadToken as string,
    uploadUrl: item.uploadUrl as string,
    expiresAtUtc: typeof item.expiresAtUtc === "string" && item.expiresAtUtc !== "" ? item.expiresAtUtc : null,
    contentType: item.contentType as string,
    maximumSizeBytes: item.maximumSizeBytes as number,
  };
}

/** Asks the backend for one upload URL per file. The slot lives at data.uploads[0]. */
export async function createUploadUrls(files: UploadRequestFile[]): Promise<UploadUrlItem[]> {
  const data: unknown = await apiPost<unknown>(UPLOAD_URLS_PATH, { files });

  if (data === null || typeof data !== "object" || !Array.isArray((data as { uploads?: unknown }).uploads)) {
    throw new ApiError("server", "upload-urls returned no upload slot");
  }

  const uploads: unknown[] = (data as { uploads: unknown[] }).uploads;

  if (uploads.length === 0) {
    throw new ApiError("server", "upload-urls returned no upload slot");
  }

  return uploads.map(toUploadUrlItem);
}

/** True when the slot cannot be used any more, so a new one must be requested. */
export function isUploadUrlExpired(item: UploadUrlItem): boolean {
  if (item.expiresAtUtc === null) {
    return true;
  }

  const expiresAt: number = Date.parse(item.expiresAtUtc);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

/** Puts the raw file on the storage. The storage signs uploadUrl and its Content-Type header. */
export async function uploadFile(uploadUrl: string, file: File, contentType: string): Promise<void> {
  await apiPutFile(uploadUrl, file, contentType);
}

/** Confirms the uploaded asset so the onboarding request accepts it. */
export async function confirmAsset(assetId: string, uploadToken: string): Promise<void> {
  await apiPost<unknown>(`${ASSETS_PATH}/${encodeURIComponent(assetId)}/confirm`, {}, {
    "X-Onboarding-Upload-Token": uploadToken,
  });
}
