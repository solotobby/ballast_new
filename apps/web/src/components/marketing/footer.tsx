import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="mt-14 border-t border-line">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-4 px-6 py-8 text-[13px] text-ink-400">
        <Logo size={22} className="text-ink-700" />
        <span>© 2026 Ballast Compliance Ltd · Registered in England & Wales</span>
        <div className="ml-auto flex gap-4">
          <Link href="/pricing" className="hover:text-ink-700">
            Pricing
          </Link>
          <span>Terms</span>
          <span>Privacy</span>
          <span>DPA</span>
        </div>
      </div>
    </footer>
  );
}
