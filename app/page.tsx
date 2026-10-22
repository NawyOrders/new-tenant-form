// This file is the home page. It only sends the visitor to the registration wizard.

import type { ReactElement } from "react";
import { redirect } from "next/navigation";

export default function HomePage(): ReactElement {
  redirect("/register");
}
