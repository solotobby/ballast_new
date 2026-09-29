import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing",
  description: "UK SME compliance plans in GBP, ex-VAT. Free to respond to buyer requests. Paid plans from £39/month.",
};

export default function Page() {
  return <PricingPage />;
}
