"use client";

import Link from "next/link";
import { useSession } from "@/lib/use-session";

export function SessionCta({
  guestHref,
  guestLabel,
  className,
}: {
  guestHref: string;
  guestLabel: string;
  className: string;
}) {
  const user = useSession();
  return (
    <Link href={user ? "/app" : guestHref} className={className}>
      {user ? "Dashboard" : guestLabel}
    </Link>
  );
}
