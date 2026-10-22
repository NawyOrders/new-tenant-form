// This file is the upload area of the app: a drop zone, the name and the size of the chosen
// file, and a button to remove it. It is used twice in step 1 (the logo and the menu).

import type { ChangeEvent, DragEvent, ReactElement } from "react";

type FileUploadProps = {
  /** The id of the file input. It must be unique in the page. */
  id: string;
  /** The label shown above the drop zone. */
  label: string;
  /** The text shown inside the empty drop zone. */
  dropText: string;
  /** The small line under the text: the accepted formats and the size limit. */
  hint: string;
  /** The accepted formats, in the format the file input wants. */
  accept: string;
  /** The chosen file, null when there is no file yet. */
  file: File | null;
  /** The local picture of the file, null when the file has no picture (a PDF for example). */
  previewUrl: string | null;
  /** The error message shown under the area. */
  error?: string;
  /** The text of the button that removes the chosen file. */
  removeLabel: string;
  /** Called with the chosen file, or with null when the file is removed. */
  onSelect: (file: File | null) => void;
};

export default function FileUpload({
  id,
  label,
  dropText,
  hint,
  accept,
  file,
  previewUrl,
  error,
  removeLabel,
  onSelect,
}: FileUploadProps): ReactElement {
  const headingId: string = `${id}-heading`;
  const hintId: string = `${id}-hint`;
  const errorId: string = `${id}-error`;
  const hasError: boolean = error !== undefined && error !== "";

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onSelect(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    onSelect(event.dataTransfer.files[0] ?? null);
  }

  return (
    <div>
      <span id={headingId} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </span>

      {file === null ? (
        <label
          htmlFor={id}
          onDragOver={(event: DragEvent<HTMLLabelElement>) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-line bg-soft/40 px-4 py-8 text-center transition hover:border-primary focus-within:border-primary"
        >
          <input
            id={id}
            type="file"
            accept={accept}
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

          <span className="text-sm font-semibold text-ink">{dropText}</span>
          <span id={hintId} className="text-xs text-muted">
            {hint}
          </span>
        </label>
      ) : (
        <div className="flex items-center gap-4 rounded-panel border border-line bg-soft/40 p-4">
          {previewUrl === null ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-panel border border-line bg-card text-primary">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
                <path d="M14 3v5h5" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            // The file is a local file, so a normal <img> is the right element here.
            // eslint-disable-next-line @next/next/no-img-element -- a local blob address cannot go through next/image
            <img
              src={previewUrl}
              alt={label}
              className="h-14 w-14 shrink-0 rounded-panel border border-line bg-card object-contain p-1"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="mt-0.5 text-xs text-muted">{formatFileSize(file.size)}</p>
          </div>

          <button
            type="button"
            onClick={() => onSelect(null)}
            className="h-10 shrink-0 rounded-panel border border-line bg-card px-4 text-sm font-semibold text-danger-strong transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {removeLabel}
          </button>
        </div>
      )}

      {hasError ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-danger-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Writes the size of a file in KB or MB. */
function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}
