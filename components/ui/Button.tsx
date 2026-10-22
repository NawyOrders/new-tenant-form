// This file is the button of the app: a primary button for the main action and a secondary one.

import type { ReactElement, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  /** "primary" is the main action (for example "Next"), "secondary" is the quiet one. */
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  /** Shows a spinner and blocks the clicks. */
  isLoading?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  isLoading = false,
  className = "",
  ariaLabel,
}: ButtonProps): ReactElement {
  const base: string =
    "inline-flex h-12 items-center justify-center gap-2 rounded-panel px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-60";

  const variantClass: string =
    variant === "secondary"
      ? "border border-line bg-card text-ink hover:bg-soft"
      : "bg-primary-dark text-white shadow-button hover:bg-primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`${base} ${variantClass} ${className}`}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
