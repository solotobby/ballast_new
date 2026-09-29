import Link from "next/link";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SessionCta } from "@/components/marketing/session-cta";

const capabilities = [
  {
    title: "Know exactly what applies",
    body: "A personalised obligation list for your sector, sites and activities — in minutes, not after a consultant visit.",
    ic: "📋",
  },
  {
    title: "One logbook and vault",
    body: "Replace paper diaries and scattered spreadsheets. Staff log checks on a phone; evidence is filed against the right duty.",
    ic: "📒",
  },
  {
    title: "Why it keeps failing",
    body: "Continuous monitoring plus AI that explains recurrence in plain language — with a confidence flag, not as unqualified fact.",
    ic: "✦",
  },
  {
    title: "Prove it on demand",
    body: "Share a scoped, revocable compliance passport with a client, contractor or insurer. It stays live as your evidence changes.",
    ic: "🔗",
  },
];

const sectors = [
  { em: "🍽️", name: "Hospitality & food" },
  { em: "🏗️", name: "Construction & trades" },
  { em: "🧑‍⚕️", name: "Care & childcare" },
  { em: "🛒", name: "Licensed retail" },
  { em: "🏢", name: "Property & facilities" },
];

const personas = [
  {
    title: "Owner / manager",
    body: "See if you are covered right now. Invite the team, review AI-flagged duties, generate reports from evidence you already hold.",
  },
  {
    title: "On-site staff",
    body: "No blank forms. Guided checks for your site only — fridge temps, refusals, near misses — captured on a phone browser.",
  },
  {
    title: "Buyers & procurement",
    body: "Open a share link during supplier onboarding. Read-only, free to view, scoped to that one business.",
  },
  {
    title: "Insurers",
    body: "Consented, portfolio-level compliance as a live risk signal — instead of a once-a-year renewal form.",
  },
];

const trust = [
  { t: "UK data residency", s: "London region · UK GDPR / DPA 2018" },
  { t: "Each organisation isolated", s: "Your café never sees another tenant’s vault" },
  { t: "AI is reviewable", s: "Confidence flags · rules version on every call" },
  { t: "14-day free trial", s: "No card · obligation list in minutes" },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(14,165,233,0.12),transparent_60%)]">
        <div className="mx-auto max-w-[1160px] px-6 pb-8 pt-16 text-center md:pt-20">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 font-mono text-[12px] font-semibold text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            Built for UK small businesses
          </span>
          <h1 className="font-display mx-auto max-w-3xl text-[42px] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[54px]">
            Compliance you can prove — before an inspector asks.
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-ink-500">
            Ballast tells you exactly which duties apply, keeps the evidence, warns you before anything lapses, and lets
            you prove it to a client or insurer on demand.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <SessionCta
              guestHref="/signup"
              guestLabel="Start 14-day free trial"
              className="btn btn-primary inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-[15px] font-semibold"
            />
            <Link
              href="/pricing"
              className="btn btn-ghost inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-[15px] font-semibold"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-ink-400">
            No card required. Personalised obligations for hospitality, trades, care, retail and property.
          </p>
        </div>

        <div className="mx-auto max-w-[1100px] px-6 pb-16">
          <DashboardPreview />
        </div>
      </section>

      <section id="product" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="mx-auto mb-10 max-w-[560px] text-center">
            <h2 className="font-display text-[32px] font-bold tracking-tight text-ink">One system instead of the patchwork</h2>
            <p className="mt-3 text-base text-ink-500">
              Most SMEs have no compliance function. Ballast replaces paper diaries, spreadsheets and disconnected apps.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {capabilities.map((c) => (
              <article key={c.title} className="card-elevated card-interactive p-6 transition-all hover:-translate-y-0.5">
                <div className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl border border-sky-200 bg-sky-50 text-xl">{c.ic}</div>
                <h3 className="font-display text-[17px] font-bold text-ink">{c.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sectors" className="scroll-mt-20 py-6">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="mx-auto mb-8 max-w-[560px] text-center">
            <h2 className="font-display text-[32px] font-bold tracking-tight text-ink">Built around how UK SMEs actually operate</h2>
            <p className="mt-3 text-base text-ink-500">
              Sector packs first. Your obligation set is generated from what you do — then you confirm it.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-colors"
              >
                <span className="text-base">{s.em}</span>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="mx-auto mb-10 max-w-[560px] text-center">
            <h2 className="font-display text-[32px] font-bold tracking-tight text-ink">The same data, four jobs</h2>
            <p className="mt-3 text-base text-ink-500">
              Each organisation is a tenant. Staff, buyers and insurers only see what you grant them.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {personas.map((p) => (
              <article key={p.title} className="card-elevated card-interactive p-6 transition-all hover:-translate-y-0.5">
                <h3 className="font-display text-[17px] font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="card-elevated grid gap-2 p-3 md:grid-cols-4">
            {trust.map((item) => (
              <div key={item.t} className="flex gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{item.t}</div>
                  <div className="mt-0.5 text-xs text-ink-400">{item.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="card-obsidian relative overflow-hidden rounded-[24px] p-10 md:p-14 text-center text-white">
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.3),transparent_70%)]" />
            <h2 className="font-display relative text-[32px] font-bold tracking-tight text-white md:text-[36px]">
              Know you’re covered — before an inspector asks
            </h2>
            <p className="relative mx-auto mt-3 max-w-[520px] text-base text-slate-300">
              Start free, see your obligations in minutes, and only pay when it’s working for you.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3.5">
              <SessionCta
                guestHref="/signup"
                guestLabel="Start 14-day free trial"
                className="btn btn-primary inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-[15px] font-semibold"
              />
              <Link
                href="/pricing"
                className="btn btn-ghost inline-flex items-center justify-center rounded-xl border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
