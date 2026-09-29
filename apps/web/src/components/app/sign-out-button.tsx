"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { client } from "@/lib/api";

export function SignOutButton({
  variant = "ghost",
  className = "",
}: {
  variant?: "ghost" | "danger" | "sidebar";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await client.signOut();
    } catch {
      /* still leave the session locally */
    }
    router.replace("/signin");
    router.refresh();
  }

  const styles = {
    ghost: "rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas-2",
    danger:
      "rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-over-500 hover:bg-over-050",
    sidebar: "w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#aebccd] hover:bg-white/5 hover:text-white",
  } as const;

  return (
    <button type="button" onClick={onClick} disabled={pending} className={`${styles[variant]} ${className}`}>
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
