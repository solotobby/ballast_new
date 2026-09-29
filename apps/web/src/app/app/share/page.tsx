import type { Metadata } from "next";
import { ShareFlow } from "@/components/app/share/share-flow";

export const metadata: Metadata = { title: "Share compliance" };

export default function SharePage() {
  return <ShareFlow />;
}
