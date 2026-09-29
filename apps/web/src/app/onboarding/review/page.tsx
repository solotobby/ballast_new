import type { Metadata } from "next";
import { BusinessCreationWizard } from "@/components/onboarding/business-creation-wizard";

export const metadata: Metadata = {
  title: "Review obligations · Ballast",
};

export default function ReviewPage() {
  return <BusinessCreationWizard initialStep={3} />;
}
