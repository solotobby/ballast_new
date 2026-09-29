"use client";

import Link from "next/link";
import { useState } from "react";

const tiers = [
  {
    id: "free",
    name: "Free",
    who: "For businesses that just need to respond to compliance requests.",
    m: 0,
    a: 0,
    cta: "Get started",
    featured: false,
    style: "ghost" as const,
    feats: [
      ["Respond to buyer requests", true],
      ["Basic evidence vault", true],
      ["Expiry reminders", true],
      ["1 site · 1 user", true],
      ["Full obligation engine", false],
      ["Governance dashboard", false],
    ] as [string, boolean][],
  },
  {
    id: "starter",
    name: "Starter",
    who: "Single-site owner-managers feeling real regulatory pressure.",
    m: 49,
    a: 39,
    cta: "Start free trial",
    featured: false,
    style: "dark" as const,
    feats: [
      ["Personalised obligation engine", true],
      ["Operational logbook", true],
      ["Full evidence vault", true],
      ["Governance dashboard", true],
      ["Email & in-app alerts", true],
      ["1 site · up to 5 users", true],
    ] as [string, boolean][],
  },
  {
    id: "growth",
    name: "Growth",
    who: "Growing & small multi-site operators who want to stay ahead.",
    m: 129,
    a: 99,
    cta: "Start free trial",
    featured: true,
    style: "primary" as const,
    feats: [
      ["Everything in Starter", true],
      ["Continuous monitoring + root-cause AI", true],
      ["Statutory report generation", true],
      ["Buyer share links", true],
      ["SMS alerts & escalation", true],
      ["Up to 3 sites · 20 users", true],
    ] as [string, boolean][],
  },
  {
    id: "multi",
    name: "Multi-site",
    who: "Multi-site businesses needing control, roles & integrations.",
    m: 349,
    a: 279,
    cta: "Start free trial",
    featured: false,
    style: "dark" as const,
    feats: [
      ["Everything in Growth", true],
      ["Advanced role-based access", true],
      ["API access & webhooks", true],
      ["Priority phone support", true],
      ["Guided onboarding", true],
      ["Up to 10 sites · unlimited users", true],
    ] as [string, boolean][],
  },
];

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full ${
        on ? "bg-ok-050 text-ok-500" : "bg-canvas-2 text-ink-400"
      }`}
    >
      {on ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 12h12" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <section className="bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(31,111,235,0.10),transparent_60%)] pb-10 pt-14 text-center">
        <div className="mx-auto max-w-[1160px] px-6">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-050 px-3.5 py-1.5 text-[13px] font-semibold text-brand-600">
            Built for UK small businesses
          </span>
          <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight">
            Compliance cover that fits
            <br />
            your business
          </h1>
          <p className="mx-auto mt-3.5 max-w-[620px] text-[17px] leading-relaxed text-ink-500">
            From a single café to a multi-site operator, pick the plan that matches how much regulatory pressure you
            carry. No setup fees, cancel anytime.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`text-[15px] font-semibold ${annual ? "text-ink-400" : "text-ink-900"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((v) => !v)}
              className="relative h-[30px] w-14 shrink-0 rounded-full bg-brand-500"
            >
              <span
                className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-[var(--sh-1)] transition-[left] ${
                  annual ? "left-[29px]" : "left-[3px]"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`text-[15px] font-semibold ${annual ? "text-ink-900" : "text-ink-400"}`}
            >
              Annual
            </button>
            <span className="rounded-full bg-teal-050 px-2.5 py-1 text-[12.5px] font-bold text-teal-600">
              Save up to 23%
            </span>
          </div>

          <div className="mt-8 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t) => {
              const price = annual ? t.a : t.m;
              const billed =
                t.m === 0
                  ? "Free forever"
                  : annual
                    ? `£${t.a * 12} /yr — save £${(t.m - t.a) * 12} billed annually`
                    : `billed monthly, or £${t.a}/mo annually`;
              const cta =
                t.style === "primary"
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : t.style === "dark"
                    ? "bg-navy-900 text-white hover:bg-navy-800"
                    : "border border-line bg-white text-ink-700 hover:bg-canvas";
              return (
                <article
                  key={t.id}
                  className={`relative flex flex-col rounded-[var(--r-lg)] bg-white p-6 text-left shadow-[var(--sh-1)] ${
                    t.featured ? "-translate-y-1.5 border-2 border-brand-500 shadow-[var(--sh-2)]" : "border border-line"
                  }`}
                >
                  {t.featured ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                      ★ Most popular
                    </span>
                  ) : null}
                  <div className="text-base font-bold">{t.name}</div>
                  <div className="mt-1 min-h-[34px] text-[13px] text-ink-500">{t.who}</div>
                  <div className="mt-4 flex items-end gap-0.5">
                    <span className="mb-1 text-[22px] font-bold text-ink-700">£</span>
                    <span className="text-[40px] font-extrabold leading-none tracking-tight">{price}</span>
                    {t.m > 0 ? <span className="mb-1 text-sm text-ink-500">/mo</span> : null}
                  </div>
                  <div className="mt-1 min-h-[34px] text-[12.5px] text-ink-400">
                    {annual && t.m > 0 ? <span className="font-semibold text-teal-600">{billed}</span> : billed}
                  </div>
                  <Link
                    href="/signup"
                    className={`my-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${cta}`}
                  >
                    {t.cta}
                  </Link>
                  <ul className="flex flex-col gap-2.5">
                    {t.feats.map(([label, on]) => (
                      <li
                        key={label}
                        className={`flex gap-2.5 text-[13.5px] leading-snug ${on ? "text-ink-700" : "text-ink-400"}`}
                      >
                        <Check on={on} />
                        {label}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <p className="mt-5 text-[13px] text-ink-400">
            {annual
              ? "Annual prices shown per month, billed as one payment. All prices ex-VAT (20% VAT added for UK customers)."
              : "All prices ex-VAT (20% VAT added for UK customers). Switch to annual to save up to 23%."}
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-[var(--r-lg)] bg-gradient-to-br from-navy-800 to-navy-700 px-8 py-7 text-white">
            <div className="min-w-[260px] flex-1">
              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7fe8da]" />
                Enterprise & Partners
              </span>
              <h3 className="text-xl font-bold tracking-tight">Large operators, frameworks, insurers & procurement</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#c3d2e3]">
                For 10+ sites, main-contractor supplier frameworks, and insurer risk-data partnerships. SSO/SAML, custom
                DPA, dedicated success, and the risk-data API.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy-800"
            >
              Talk to sales
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="flex gap-3.5 rounded-[var(--r-lg)] border border-line bg-white p-5 shadow-[var(--sh-1)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-050 text-teal-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold">Verifying a supplier?</h4>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  If a supplier shares their Ballast compliance with you, viewing it is free — no account needed.
                </p>
                <div className="mt-2 text-[12.5px] font-bold text-ink-700">Buyers & procurement — £0</div>
              </div>
            </div>
            <div className="flex gap-3.5 rounded-[var(--r-lg)] border border-line bg-white p-5 shadow-[var(--sh-1)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef0fb] text-[#4436c9]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l4-5 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold">Insurer or underwriter?</h4>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  Consume consented compliance-risk data via API or partner dashboard for underwriting and renewals.
                </p>
                <div className="mt-2 text-[12.5px] font-bold text-ink-700">Commercial partnership — custom</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
