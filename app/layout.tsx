// This file is the root layout: it loads the two fonts, sets the language and the direction
// of the page, and injects the colors of the theme as CSS variables.
//
// The visitor chooses the language inside the wizard, so the <html> tag starts in Arabic
// and the register page updates its lang/dir attributes as soon as the language changes.

import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import { themeCssVariablesBlock } from "@/lib/theme";
import "./globals.css";

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-noto-kufi-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nawy Orders – Restaurant Registration",
  description: "Register a new restaurant on Nawy Orders in 4 simple steps.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="ar" dir="rtl" className={`${notoKufiArabic.variable} ${inter.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCssVariablesBlock() }} />
      </head>
      <body className="min-h-screen bg-page text-ink antialiased">{children}</body>
    </html>
  );
}
