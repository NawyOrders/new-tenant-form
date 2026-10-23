// This file is the top bar of the wizard: the title of the app and the language button.

import Image from "next/image";
import type { ReactElement } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type TopBarProps = {
  /** The language of the app right now. */
  lang: Lang;
  /** Called when the visitor asks for the other language. */
  onToggleLang: () => void;
};

export default function TopBar({ lang, onToggleLang }: TopBarProps): ReactElement {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-panel bg-card">
          <Image
            src="/nawy-orders-logo.png"
            alt={t(lang, "app.logoAlt")}
            width={44}
            height={44}
            priority
            className="h-full w-full object-contain"
          />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(lang, "app.brand")}</p>
          <h1 className="truncate text-lg font-semibold leading-tight text-ink sm:text-xl">
            {t(lang, "app.title")}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleLang}
        aria-label={t(lang, "app.langToggle")}
        className="h-11 shrink-0 rounded-panel border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      >
        {t(lang, "app.langToggle")}
      </button>
    </div>
  );
}
