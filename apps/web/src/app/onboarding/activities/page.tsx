import type { Metadata } from "next";
import { BusinessCreationWizard } from "@/components/onboarding/business-creation-wizard";

export const metadata: Metadata = {
  title: "Activities · Ballast",
};

export default function ActivitiesPage() {
  return <BusinessCreationWizard initialStep={2} />;
}
