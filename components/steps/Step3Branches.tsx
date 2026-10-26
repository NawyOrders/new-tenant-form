// This file is step 3 "الفروع": the list of the branch cards and the button that adds a new
// branch (2 branches maximum).

"use client";

import type { FocusEvent, ReactElement } from "react";
import BranchCard from "@/components/branches/BranchCard";
import Button from "@/components/ui/Button";
import { MAX_BRANCHES, createEmptyBranch } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Branch, Lang, RegisterData, StepErrors } from "@/lib/types";

type Step3BranchesProps = {
  data: RegisterData;
  errors: StepErrors;
  lang: Lang;
  onChange: (patch: Partial<RegisterData>) => void;
  /** Called with the field key when a validated field loses focus. */
  onBlurField: (field: string) => void;
};

export default function Step3Branches({ data, errors, lang, onChange, onBlurField }: Step3BranchesProps): ReactElement {
  const isFull: boolean = data.branches.length >= MAX_BRANCHES;

  /** Shows the name error when the name field of a branch loses focus. */
  function handleBranchBlur(branchId: number, index: number, event: FocusEvent<HTMLDivElement>): void {
    const target = event.target;

    if (target instanceof HTMLInputElement && target.name === `branch-name-${branchId}`) {
      onBlurField(`branches.${index}.name`);
    }
  }

  /** Replaces one branch in the list with the new values from its card. */
  function handleBranchChange(branchId: number, patch: Partial<Branch>): void {
    const updater = (prev: RegisterData): Partial<RegisterData> => ({
      branches: prev.branches.map((branch) =>
        branch.id === branchId ? { ...branch, ...patch } : branch,
      ),
    });
    onChange(updater as unknown as Partial<RegisterData>);
  }

  function handleBranchRemove(branchId: number): void {
    onChange({ branches: data.branches.filter((branch) => branch.id !== branchId) });
  }

  function handleAddBranch(): void {
    if (isFull) {
      return;
    }

    onChange({ branches: [...data.branches, createEmptyBranch()] });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold leading-7 text-ink">{t(lang, "step.3")}</h2>
      <p className="mt-2 text-sm text-muted">{t(lang, "branches.helper")}</p>

      {errors["branches"] !== undefined ? (
        <p role="alert" className="mt-4 rounded-panel bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-strong">
          {errors["branches"]}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {data.branches.map((branch, index) => (
          <div key={branch.id} onBlur={(event) => handleBranchBlur(branch.id, index, event)}>
            <BranchCard
              branch={branch}
              index={index}
              errors={errors}
              lang={lang}
              canRemove={data.branches.length > 1}
              onChange={(patch) => handleBranchChange(branch.id, patch)}
              onRemove={() => handleBranchRemove(branch.id)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" disabled={isFull} onClick={handleAddBranch}>
          {t(lang, "branches.add")}
        </Button>

        {isFull ? (
          <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark">
            {t(lang, "branches.count")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
