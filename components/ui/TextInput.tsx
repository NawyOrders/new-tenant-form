// This file is the text field of the app: a visible label, the input, and the error message.

import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

type TextInputProps = {
  /** The label shown above the field. It is always visible. */
  label: string;
  /** The name of the field, used to build the id of the input. */
  name: string;
  value: string;
  /** Called with the new value every time the user types. */
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "time";
  placeholder?: string;
  /** The error message shown under the field. */
  error?: string;
  /** A small hint shown under the field (used when there is no error). */
  hint?: string;
  /** "ltr" for the phone, the email and the coordinates. */
  dir?: "ltr" | "rtl";
  readOnly?: boolean;
  required?: boolean;
  /** Called when a key is pressed inside the field (used by the address search). */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Extra classes for the input (used to align the text). */
  className?: string;
};

export default function TextInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  hint,
  dir,
  readOnly = false,
  required = false,
  onKeyDown,
  className = "",
}: TextInputProps): ReactElement {
  const inputId: string = `field-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const errorId: string = `${inputId}-error`;
  const hintId: string = `${inputId}-hint`;
  const hasError: boolean = error !== undefined && error !== "";

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-danger-strong"> *</span> : null}
      </label>

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        dir={dir}
        readOnly={readOnly}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : hint !== undefined ? hintId : undefined}
        className={`h-12 w-full rounded-panel border bg-card px-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/30 read-only:bg-soft read-only:text-muted ${
          hasError ? "border-danger-strong" : "border-line"
        } ${dir === "ltr" ? "text-left" : ""} ${className}`}
      />

      {hasError ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-danger-strong">
          {error}
        </p>
      ) : null}

      {!hasError && hint !== undefined ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
