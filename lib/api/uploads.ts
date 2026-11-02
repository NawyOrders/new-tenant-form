// This file talks to the onboarding upload endpoints: it asks for upload URLs, puts the
// file on the storage, and confirms the asset so the backend can use it.

import { ApiError, apiPost, apiPutFile } from "./client";
import type { MenuAsset } from "@/lib/types";
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
export async function confirmAsset(assetId: string): Promise<void> {
  await apiPost<unknown>(`${ASSETS_PATH}/${encodeURIComponent(assetId)}/confirm`, {});
}

/** Where the upload of one menu file stopped. */
export type MenuUploadStage = "urls" | "put" | "confirm";

/** Why the upload of one menu file stopped. */
export type MenuUploadReason = "tooLarge" | "missingConfig" | "api";

/** The result of one menu file of a batch. The index points into the files array. */
export type MenuUploadOutcome =
  | { index: number; status: "done"; asset: MenuAsset }
  | { index: number; status: "failed"; stage: MenuUploadStage; reason: MenuUploadReason };

/** Reads the reason of one failed menu file upload. */
function menuFailureReason(error: unknown): MenuUploadReason {
  if (error instanceof UploadTooLargeError) return "tooLarge";
  if (error instanceof ApiError && error.kind === "missing_config") return "missingConfig";
  return "api";
}

/**
 * Uploads every menu file in order. One upload-urls call asks for one slot per file, and the
 * slots are matched to the files by index. A slot count that differs from the file count stops
 * the whole batch, because a file must never go to another file's slot. A failure of one file
 * keeps the files that finished and marks only that file as failed.
 */
export async function uploadMenuFiles(files: File[]): Promise<MenuUploadOutcome[]> {
  const requested: UploadRequestFile[] = files.map((file) => ({
    type: UPLOAD_TYPE_MENU,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  }));
  const items: UploadUrlItem[] = await createUploadUrls(requested);

  if (items.length !== files.length) {
    throw new ApiError("server", `upload-urls returned ${items.length} uploads for ${files.length} files`);
  }

  const outcomes: MenuUploadOutcome[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file: File = files[index];
    const item: UploadUrlItem = items[index];
    let stage: MenuUploadStage = "urls";

    try {
      if (file.size > item.maximumSizeBytes) {
        throw new UploadTooLargeError();
      }

      // The storage signs this header, so a different browser type must stop the upload here.
      if (file.type !== "" && file.type !== item.contentType) {
        throw new ApiError("server", `The file is ${file.type} but the upload URL signs ${item.contentType}`);
      }

      stage = "put";
      await uploadFile(item.uploadUrl, file, item.contentType);

      stage = "confirm";
      await confirmAsset(item.assetId);

      outcomes.push({
        index,
        status: "done",
        asset: {
          assetId: item.assetId,
          // The current Swagger returns no upload token, and confirm takes no token header.
          uploadToken: null,
          fileName: file.name,
          contentType: item.contentType,
        },
      });
    } catch (error) {
      outcomes.push({ index, status: "failed", stage, reason: menuFailureReason(error) });
    }
  }

  return outcomes;
}

/** Where the logo upload stopped. */
export type LogoUploadStage = "urls" | "put" | "confirm";

/** Why the logo upload stopped. */
export type LogoUploadReason = "tooLarge" | "missingConfig" | "api";

/** Thrown by uploadLogo, with the step that failed so the form can say what to retry. */
export class LogoUploadError extends Error {
  readonly stage: LogoUploadStage;
  readonly reason: LogoUploadReason;

  constructor(stage: LogoUploadStage, reason: LogoUploadReason) {
    super(`The logo upload failed at ${stage}`);
    this.name = "LogoUploadError";
    this.stage = stage;
    this.reason = reason;
  }
}

/**
 * Uploads one logo in the three backend steps: ask for the URL, PUT the raw file with exactly
 * the content type the URL signs, then confirm the asset. The id is returned only after the
 * confirm succeeds, so a caller never stores an asset the backend did not accept.
 */
export async function uploadLogo(file: File): Promise<{ assetId: string }> {
  let stage: LogoUploadStage = "urls";

  try {
    const items: UploadUrlItem[] = await createUploadUrls([
      { type: UPLOAD_TYPE_LOGO, fileName: file.name, contentType: file.type, sizeBytes: file.size },
    ]);
    const item: UploadUrlItem | undefined = items[0];

    if (item === undefined) {
      throw new ApiError("server", "upload-urls returned no upload slot");
    }

    if (file.size > item.maximumSizeBytes) {
      throw new UploadTooLargeError();
    }

    // The storage signs this header, so a different browser type must stop the upload here.
    if (file.type !== "" && file.type !== item.contentType) {
      throw new ApiError("server", `The file is ${file.type} but the upload URL signs ${item.contentType}`);
    }

    stage = "put";
    await uploadFile(item.uploadUrl, file, item.contentType);

    stage = "confirm";
    await confirmAsset(item.assetId);

    return { assetId: item.assetId };
  } catch (error) {
    if (error instanceof UploadTooLargeError) {
      throw new LogoUploadError("urls", "tooLarge");
    }

    if (error instanceof ApiError && error.kind === "missing_config") {
      throw new LogoUploadError(stage, "missingConfig");
    }

    throw new LogoUploadError(stage, "api");
  }
}
