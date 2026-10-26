// This file shows ONE branch inside the phone preview: its name, its address, the coordinates
// and the opening hours.

import type { ReactElement } from "react";
import { t } from "@/lib/i18n";
import { isValidName } from "@/lib/validation";
import type { Branch, Lang } from "@/lib/types";

type PreviewBranchProps = {
  branch: Branch;
  /** The position of the branch in the list (0 or 1). */
  index: number;
  lang: Lang;
  /** The color of the accent of the brand. */
  accentColor: string;
  /** The color of the text of the customer page. */
  textColor: string;
  /** The color of the quiet text of the customer page. */
  mutedColor: string;
  /** The color of the panels of the customer page. */
  panelColor: string;
};

export default function PreviewBranch({
  branch,
  index,
  lang,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
}: PreviewBranchProps): ReactElement {
  const hasLocation: boolean = branch.latitude !== null && branch.longitude !== null;

  const branchName: string =
    branch.name.trim() === ""
      ? index === 0
        ? t(lang, "branch.title1")
        : t(lang, "branch.title2")
      : isValidName(branch.name)
        ? branch.name
        : t(lang, "branch.name.placeholder");

  return (
    <div className="rounded-panel border border-line p-3" style={{ backgroundColor: panelColor }}>
      <p className="truncate text-xs font-semibold" style={{ color: textColor }}>
        {branchName}
      </p>

      <p className="mt-1.5 break-words text-[11px] leading-relaxed" style={{ color: mutedColor }}>
        {branch.address.trim() === "" ? t(lang, "preview.emptyValue") : branch.address}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: mutedColor }}>
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
        <span className="tabular-nums">
          {branch.openingTime === "" || branch.closingTime === ""
            ? t(lang, "preview.emptyValue")
            : `${branch.openingTime} - ${branch.closingTime}`}
        </span>
      </p>

      <p className="mt-1.5 text-[10px]" style={{ color: mutedColor }} dir="ltr">
        {hasLocation
          ? `${branch.latitude?.toFixed(6)}, ${branch.longitude?.toFixed(6)}`
          : t(lang, "preview.noLocation")}
      </p>
    </div>
  );
}
