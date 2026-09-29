import type { Metadata } from "next";
import { Suspense } from "react";
import { Logbook } from "@/components/app/logbook";

export const metadata: Metadata = { title: "Logbook" };

export default function LogbookPage() {
  return (
    <Suspense fallback={null}>
      <Logbook />
    </Suspense>
  );
}
