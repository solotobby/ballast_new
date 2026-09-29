"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useSession } from "@/lib/use-session";

const links = [
  { href: "/#product", label: "Product" },
  { href: "/#sectors", label: "Sectors" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-4 px-6">
        <Link href="/" onClick={() => setOpen(false)} aria-label="Ballast home">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = link.href === "/pricing" && pathname === "/pricing";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-canvas text-ink-900" : "text-ink-600 hover:bg-canvas hover:text-ink-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              href="/app"
              className="btn btn-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/signin" className="px-2 text-sm font-semibold text-ink-700 hover:text-ink-900">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Start free trial
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white md:hidden"
          aria-expanded={open}
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-canvas"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-canvas"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
