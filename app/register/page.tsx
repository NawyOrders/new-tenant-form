// This file is the /register page. It only renders the wizard of the app.

import type { Metadata } from "next";
import type { ReactElement } from "react";
import RegisterWizard from "@/components/RegisterWizard";

export const metadata: Metadata = {
  title: "Nawy Orders – Restaurant Registration",
};

export default function RegisterPage(): ReactElement {
  return <RegisterWizard />;
}
