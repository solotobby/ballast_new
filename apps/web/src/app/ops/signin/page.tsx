import type { Metadata } from "next";
import { OpsSignInForm } from "@/components/ops/ops-signin";

export const metadata: Metadata = {
  title: "Ops Sign in",
};

export default function OpsSignInPage() {
  return <OpsSignInForm />;
}
