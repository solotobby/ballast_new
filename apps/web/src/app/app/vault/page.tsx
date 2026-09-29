import type { Metadata } from "next";
import { Suspense } from "react";
import { Vault } from "@/components/app/vault";

export const metadata: Metadata = { title: "Evidence Vault" };

export default function VaultPage() {
  return (
    <Suspense fallback={null}>
      <Vault />
    </Suspense>
  );
}
