// This file is the menu upload area of step 1: one drop zone for many files, and one row per
// chosen file with its picture or document icon, its upload state, a retry and a remove button.

"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { t } from "@/lib/i18n";
import type { Lang, MenuFileUploadState } from "@/lib/types";

type MenuFileUploadProps = {
  /** The id of the file input. It must be unique in the page. */
  id: string;
  lang: Lang;
  /** The chosen menu files, in the order they were added. */
  files: File[];
  /** The upload state of every chosen file, matched by fileName. */
  uploads: MenuFileUploadState[];
  /** The error message shown under the area. */
  error?: string;
  /** The accepted formats, in the format the file input wants. */
  accept: string;
  /** True while a file is uploading, so the list does not change under the upload. */
  disabled: boolean;
  /** Called with the files the visitor chose or dropped. */
  onAdd: (files: File[]) => void;
  /** Called with the name of the file the visitor wants to remove. */
  onRemove: (fileName: string) => void;
  /** Called with the name of the failed file the visitor wants to upload again. */
  onRetry: (fileName: string) => void;
};

export default function MenuFileUpload({
  id,
  lang,
  files,
  uploads,
  error,
  accept,
  disabled,
  onAdd,
  onRemove,
  onRetry,
}: MenuFileUploadProps): ReactElement {
  const headingId: string = `${id}-heading`;
  const hintId: string = `${id}-hint`;
  const errorId: string = `${id}-error`;
  const hasError: boolean = error !== undefined && error !== "";

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const chosen: File[] = Array.from(event.target.files ?? []);
    // Clearing the value lets the visitor choose the same file again after removing it.
    event.target.value = "";

    if (chosen.length > 0) {
      onAdd(chosen);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const dropped: File[] = Array.from(event.dataTransfer.files);

    if (dropped.length > 0) {
      onAdd(dropped);
    }
  }

  return (
    <div>
      <span id={headingId} className="mb-2 block text-sm font-semibold text-ink">
        {t(lang, "field.menu")}
      </span>

      <label
        htmlFor={id}
        onDragOver={(event: DragEvent<HTMLLabelElement>) => event.preventDefault()}
        onDrop={handleDrop}
        aria-disabled={disabled}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-line bg-soft/40 px-4 py-8 text-center transition hover:border-primary focus-within:border-primary ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          multiple
          disabled={disabled}
          onChange={handleChange}
          aria-labelledby={headingId}
          aria-describedby={hasError ? errorId : hintId}
          className="sr-only"
        />

        <span className="flex h-11 w-11 items-center justify-center rounded-panel bg-primary/10 text-primary">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
          </svg>
        </span>

        <span className="text-sm font-semibold text-ink">{t(lang, "field.menu.drop")}</span>
        <span id={hintId} className="text-xs text-muted">
          {t(lang, "field.menu.hint")}
        </span>
      </label>

      <p className="mt-2 text-xs font-semibold text-muted">{t(lang, "menu.count", { count: files.length })}</p>

      {files.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {files.map((file: File) => (
            <MenuFileRow
              key={file.name}
              file={file}
              upload={uploads.find((entry: MenuFileUploadState) => entry.fileName === file.name)}
              lang={lang}
              disabled={disabled}
              onRemove={onRemove}
              onRetry={onRetry}
            />
          ))}
        </ul>
      ) : null}

      {hasError ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-danger-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type MenuFileRowProps = {
  file: File;
  upload: MenuFileUploadState | undefined;
  lang: Lang;
  disabled: boolean;
  onRemove: (fileName: string) => void;
  onRetry: (fileName: string) => void;
};

/** One menu file: its picture or document icon, its size, its state and its two buttons. */
function MenuFileRow({ file, upload, lang, disabled, onRemove, onRetry }: MenuFileRowProps): ReactElement {
  const isImage: boolean = file.type.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) {
      return undefined;
    }

    const url: string = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const status: string = upload?.status ?? "idle";
  const errorKey = upload?.errorKey ?? null;
  const statusText: string =
    errorKey !== null
      ? t(lang, errorKey)
      : status === "uploading"
        ? t(lang, "upload.uploading")
        : status === "done"
          ? t(lang, "upload.done")
          : status === "failed"
            ? t(lang, "menu.fileFailed")
            : "";
  const statusTone: string =
    status === "failed" ? "text-danger-strong" : status === "done" ? "text-success-strong" : "text-muted";
  const isUploading: boolean = status === "uploading";

  return (
    <li className="flex items-center gap-3 rounded-panel border border-line bg-soft/40 p-3">
      {isImage && previewUrl !== null ? (
        // The file is a local file, so a normal <img> is the right element here.
        // eslint-disable-next-line @next/next/no-img-element -- a local blob address cannot go through next/image
        <img
          src={previewUrl}
          alt={file.name}
          className="h-12 w-12 shrink-0 rounded-panel border border-line bg-card object-contain p-1"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-panel border border-line bg-card text-primary">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
            <path d="M14 3v5h5" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
        <p className="mt-0.5 text-xs text-muted">{formatFileSize(file.size)}</p>

        {statusText !== "" ? (
          <p className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${statusTone}`}>
            {isUploading ? (
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : null}
            <span>{statusText}</span>
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === "failed" ? (
          <button
            type="button"
            onClick={() => onRetry(file.name)}
            disabled={disabled}
            className="h-8 rounded-panel border border-line bg-card px-3 text-xs font-semibold text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t(lang, "menu.retryFile")}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onRemove(file.name)}
          disabled={disabled || isUploading}
          className="h-8 rounded-panel border border-line bg-card px-3 text-xs font-semibold text-danger-strong transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t(lang, "btn.remove")}
        </button>
      </div>
    </li>
  );
}

/** Writes the size of a file in KB or MB. */
function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}
