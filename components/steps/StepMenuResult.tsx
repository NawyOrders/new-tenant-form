// This file is step 5 "استخراج المنيو": it sends the menu picture to the OCR endpoint, follows
// the job until it finishes, and shows the first items the backend read.
// Nothing is sent unless the menu is a picture the endpoint accepts.

"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import {
  MENU_OCR_MAX_BYTES,
  MENU_OCR_TYPES,
  getJobResult,
  getJobStatus,
  submitMenuOcr,
} from "@/lib/api/ocr";
import type { OcrCategory, OcrJobStatus, OcrMenuItem, OcrResult } from "@/lib/api/ocr";
import { formatNumber, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type StepMenuResultProps = {
  /** The menu kept in the form, null when it was not chosen yet. */
  menuFile: File | null;
  lang: Lang;
};

/** The wait before the first status read, in milliseconds. */
const FIRST_WAIT_MS = 3_000;

/** The longest wait between two status reads. */
const MAX_WAIT_MS = 6_000;

/** The shortest wait between two status reads. */
const MIN_WAIT_MS = 1_000;

/** How much the wait grows when the backend does not send Retry-After. */
const BACKOFF = 1.5;

/** The random part added to each wait, so many tabs do not read at the same moment. */
const JITTER_MS = 250;

/** The extraction stops after this long. */
const DEADLINE_MS = 120_000;

/** How many item cards are shown. */
const MAX_ITEMS = 5;

type MenuResultState =
  | { kind: "blocked"; messageKey: TranslationKey }
  | { kind: "submitting" }
  | { kind: "processing"; progress: number | null; stage: string | null }
  | { kind: "ready"; result: OcrResult }
  | { kind: "failed"; messageKey: TranslationKey; detail: string };

type PollOutcome =
  | { kind: "completed" }
  | { kind: "failed"; detail: string }
  | { kind: "timeout" }
  | { kind: "cancelled" };

/** The reason no request can be sent, null when the menu can go to the endpoint. */
function blockerKey(file: File | null): TranslationKey | null {
  if (file === null) {
    return "menuResult.noMenu";
  }

  if (!MENU_OCR_TYPES.includes(file.type)) {
    return "menuResult.pdfNotSupported";
  }

  if (file.size > MENU_OCR_MAX_BYTES) {
    return "menuResult.tooLarge";
  }

  return null;
}

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Reads the job until it finishes, fails, or the deadline passes. */
async function pollJob(
  jobId: string,
  isCancelled: () => boolean,
  update: (state: MenuResultState) => void,
): Promise<PollOutcome> {
  const deadline: number = Date.now() + DEADLINE_MS;
  let wait: number = FIRST_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(wait);

    if (isCancelled()) {
      return { kind: "cancelled" };
    }

    let status: OcrJobStatus;
    try {
      status = await getJobStatus(jobId);
    } catch (error) {
      return { kind: "failed", detail: messageOf(error) };
    }

    if (isCancelled()) {
      return { kind: "cancelled" };
    }

    if (status.status === "Completed") {
      return { kind: "completed" };
    }

    if (status.status === "Failed" || status.status === "Cancelled" || status.status === "Expired") {
      return { kind: "failed", detail: status.errorMessage ?? "" };
    }

    update({ kind: "processing", progress: status.progressPercentage, stage: status.stage });

    const next: number = status.retryAfterMs ?? wait * BACKOFF;
    wait = Math.min(Math.max(next, MIN_WAIT_MS), MAX_WAIT_MS) + Math.floor(Math.random() * JITTER_MS);
  }

  return { kind: "timeout" };
}

/** Sends the menu, follows the job, then reads the result. */
async function runExtraction(
  file: File,
  isCancelled: () => boolean,
  update: (state: MenuResultState) => void,
): Promise<void> {
  update({ kind: "submitting" });

  let jobId: string;
  try {
    const job = await submitMenuOcr(file);
    jobId = job.jobId;
  } catch (error) {
    update({ kind: "failed", messageKey: "menuResult.failed", detail: messageOf(error) });
    return;
  }

  if (isCancelled()) {
    return;
  }

  const outcome: PollOutcome = await pollJob(jobId, isCancelled, update);

  if (outcome.kind === "cancelled") {
    return;
  }

  if (outcome.kind === "timeout") {
    update({ kind: "failed", messageKey: "menuResult.timeout", detail: "" });
    return;
  }

  if (outcome.kind === "failed") {
    update({ kind: "failed", messageKey: "menuResult.failed", detail: outcome.detail });
    return;
  }

  try {
    const result: OcrResult = await getJobResult(jobId);

    if (!isCancelled()) {
      update({ kind: "ready", result });
    }
  } catch (error) {
    if (!isCancelled()) {
      update({ kind: "failed", messageKey: "menuResult.failed", detail: messageOf(error) });
    }
  }
}

/** One row of the list: one item and the category it belongs to. */
type ItemRow = { item: OcrMenuItem; category: OcrCategory };

function flatten(result: OcrResult): ItemRow[] {
  const rows: ItemRow[] = [];

  for (const category of result.categories) {
    for (const item of category.items) {
      rows.push({ item, category });
    }
  }

  return rows;
}

export default function StepMenuResult({ menuFile, lang }: StepMenuResultProps): ReactElement {
  const [state, setState] = useState<MenuResultState>({ kind: "blocked", messageKey: "menuResult.noMenu" });
  const [attempt, setAttempt] = useState<number>(0);

  // A new menu or a retry starts a new job. The cleanup stops the old polling.
  useEffect(() => {
    const blocked: TranslationKey | null = blockerKey(menuFile);

    if (blocked !== null || menuFile === null) {
      setState({ kind: "blocked", messageKey: blocked ?? "menuResult.noMenu" });
      return;
    }

    let cancelled = false;
    void runExtraction(menuFile, () => cancelled, setState);

    return () => {
      cancelled = true;
    };
  }, [menuFile, attempt]);

  const rows: ItemRow[] = state.kind === "ready" ? flatten(state.result) : [];
  const total: number = rows.length;
  const shown: number = Math.min(MAX_ITEMS, total);

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "menuResult.title")}</h2>

      <p className="mt-1 truncate text-xs text-muted">
        {menuFile === null ? t(lang, "menuResult.noMenu") : menuFile.name}
      </p>

      {state.kind === "blocked" ? (
        <p className="mt-5 rounded-panel bg-warning-soft px-4 py-3 text-sm font-semibold text-warning-strong">
          {t(lang, state.messageKey)}
        </p>
      ) : null}

      {state.kind === "submitting" ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {t(lang, "menuResult.submitting")}
        </p>
      ) : null}

      {state.kind === "processing" ? (
        <div role="status" className="mt-5 rounded-panel border border-line bg-soft/40 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            {t(lang, "menuResult.processing")}
            {state.progress !== null ? ` · ${formatNumber(lang, Math.round(state.progress))}%` : ""}
          </p>
          {state.stage !== null ? <p className="mt-1 text-xs text-muted">{state.stage}</p> : null}
        </div>
      ) : null}

      {state.kind === "failed" ? (
        <div className="mt-5 rounded-panel bg-danger-soft px-4 py-3">
          <p role="alert" className="text-sm font-semibold text-danger-strong">
            {t(lang, state.messageKey)}
          </p>
          {state.detail !== "" ? (
            <p className="mt-1 break-words text-xs text-danger-strong" dir="auto">
              {state.detail}
            </p>
          ) : null}
          <Button variant="secondary" className="mt-3" onClick={() => setAttempt((value) => value + 1)}>
            {t(lang, "menuResult.retry")}
          </Button>
        </div>
      ) : null}

      {state.kind === "ready" ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {t(lang, "menuResult.count", {
                shown: formatNumber(lang, shown),
                total: formatNumber(lang, total),
              })}
            </p>

            {state.result.requiresReview ? (
              <span className="rounded-pill bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning-strong">
                {t(lang, "menuResult.needsReview")}
              </span>
            ) : null}
          </div>

          {total === 0 ? (
            <p className="mt-4 rounded-panel border border-line bg-soft/40 p-4 text-sm text-muted">
              {t(lang, "menuResult.empty")}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.slice(0, MAX_ITEMS).map((row, index) => (
                <li
                  key={`${index}-${row.item.nameAr}-${row.item.nameEn}`}
                  className="rounded-panel border border-line bg-soft/40 p-3"
                >
                  <p className="text-sm font-semibold text-ink">
                    {row.item.nameAr !== "" ? row.item.nameAr : t(lang, "preview.emptyValue")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted" dir="ltr">
                    {row.item.nameEn !== "" ? row.item.nameEn : t(lang, "preview.emptyValue")}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-muted">
                      {row.category.nameAr !== ""
                        ? row.category.nameAr
                        : t(lang, "preview.emptyValue")}
                    </span>
                    <span className="shrink-0 font-semibold text-ink">{priceText(lang, row.item)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** The price with the currency the backend sent, or a dash when there is none. */
function priceText(lang: Lang, item: OcrMenuItem): string {
  if (item.price === null) {
    return t(lang, "preview.emptyValue");
  }

  const price: string = formatNumber(lang, item.price);
  return item.currency === null ? price : `${price} ${item.currency}`;
}
