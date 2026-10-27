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

/** Reads one upload target, or null when a required field is missing. */
function toUploadUrlItem(value: unknown): UploadUrlItem | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.assetId !== "string" ||
    item.assetId === "" ||
    typeof item.uploadToken !== "string" ||
    item.uploadToken === "" ||
    typeof item.uploadUrl !== "string" ||
    item.uploadUrl === "" ||
    typeof item.contentType !== "string" ||
    item.contentType === "" ||
    typeof item.maximumSizeBytes !== "number" ||
    !Number.isFinite(item.maximumSizeBytes)
  ) {
    return null;
  }

  return {
    assetId: item.assetId,
    uploadToken: item.uploadToken,
    uploadUrl: item.uploadUrl,
    contentType: item.contentType,
    maximumSizeBytes: item.maximumSizeBytes,
  };
}

/** Asks the backend for one upload URL per file. */
export async function createUploadUrls(files: UploadRequestFile[]): Promise<UploadUrlItem[]> {
  const data: unknown = await apiPost<unknown>(UPLOAD_URLS_PATH, { files });

  if (!Array.isArray(data)) {
    throw new ApiError("server", "The backend returned no upload URLs");
  }

  const items: UploadUrlItem[] = [];

  for (const value of data) {
    const item: UploadUrlItem | null = toUploadUrlItem(value);

    if (item === null) {
      throw new ApiError("server", "The backend returned an invalid upload URL");
    }

    items.push(item);
  }

  return items;
}

/** Puts the raw file on the storage. TODO: confirm with the backend that uploadUrl is a presigned PUT. */
export async function uploadFile(uploadUrl: string, file: File, contentType: string): Promise<void> {
  await apiPutFile(uploadUrl, file, contentType);
}

/** Confirms the uploaded asset so the onboarding request accepts it. */
export async function confirmAsset(assetId: string, uploadToken: string): Promise<void> {
  await apiPost<unknown>(`${ASSETS_PATH}/${encodeURIComponent(assetId)}/confirm`, {}, {
    "X-Onboarding-Upload-Token": uploadToken,
  });
}
