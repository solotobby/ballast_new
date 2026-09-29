import type { Metadata } from "next";
import { UserProfile } from "@/components/app/user-profile";

export const metadata: Metadata = {
  title: "Your profile",
};

export default function ProfilePage() {
  return <UserProfile />;
}
