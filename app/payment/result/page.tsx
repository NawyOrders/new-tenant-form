// This page shows payment result based on query string.
"use client";

import { Suspense, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

function PaymentResultContent(): ReactElement {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("ar");
  const success = searchParams.get("success");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const isSuccess = success === "true";

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-card border border-line bg-card p-6 shadow-card text-center">
        <h1 className="text-xl font-semibold text-ink">
          {isSuccess ? t(lang, "payment.success") : t(lang, "payment.failed")}
        </h1>
        <div className="mt-6">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-onPrimary transition-colors hover:bg-primaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t(lang, "payment.backToRegister")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage(): ReactElement {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <PaymentResultContent />
    </Suspense>
  );
}
