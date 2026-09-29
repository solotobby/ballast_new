import type { Metadata } from "next";
import { BusinessCreationWizard } from "@/components/onboarding/business-creation-wizard";

export const metadata: Metadata = {
  title: "Set up your business · Ballast",
};

export default function ProfilePage() {
  return <BusinessCreationWizard initialStep={0} />;
}
