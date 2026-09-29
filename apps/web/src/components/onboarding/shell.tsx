"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { IconCheck, STEP_ICONS, type StepIcon } from "@/components/onboarding/icons";
import { client } from "@/lib/api";

const POINTS = [
  "Personalised statutory obligations for your exact sector and premises in minutes.",
  "One unified logbook and evidence vault replacing paper folders and spreadsheets.",
  "Continuous compliance engine that flags regulatory gaps before inspectors arrive.",
  "Statutory inspection reports auto-filled directly from verified operational evidence.",
];

export function OnboardingShell({
  step,
  pill,
  pillIcon,
  title,
  lead,
  requireAuth = true,
  showProgress = true,
  wide = false,
  children,
  footer,
}: {
  step: number;
  pill: string;
  pillIcon?: StepIcon;
  title: string;
  lead: string;
  requireAuth?: boolean;
  showProgress?: boolean;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const router = useRouter();
  const PillIcon = pillIcon ? STEP_ICONS[pillIcon] : null;
  const longForm = step >= 3;

  useEffect(() => {
    if (!requireAuth) return;
    client.organisation().catch(() => router.replace("/signin"));
  }, [requireAuth, router]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#F8F9FA]">
      {/* Brand Hero Panel with Sunset Texture Mesh */}
      <aside className="relative hidden flex-col justify-between overflow-hidden px-14 py-12 text-white bg-[#111318] lg:sticky lg:top-0 lg:flex lg:h-screen">
        {/* Organic Sunset Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(229, 46, 46, 0.25) 0%, rgba(255, 107, 53, 0.15) 35%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 168, 52, 0.15) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" aria-label="Ballast home">
            <Logo className="text-white" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Workspace Provisioning</span>
          </div>
          <h1 className="font-display text-3xl xl:text-4xl font-bold leading-tight tracking-tight mb-4">
            Compliance you can prove — before an inspector asks.
          </h1>
          <p className="text-sm xl:text-base leading-relaxed text-[#94A3B8] mb-8">
            The operating system that tracks UK statutory obligations, organizes evidence, and warns you before anything lapses.
          </p>
          <ul className="flex flex-col gap-3.5 text-xs xl:text-sm text-[#CBD5E1]">
            {POINTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md bg-rose-500/20 text-rose-400 mt-0.5">
                  <IconCheck size={13} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-[#64748B] font-mono">
          UK SME Compliance Operating System · Continuous Audit Active
        </div>
      </aside>

      {/* Main Form Content Area */}
      <div
        className={`flex justify-center px-6 py-12 lg:px-12 ${longForm ? "items-start lg:py-16" : "items-center"}`}
      >
        <div className={`w-full ${wide ? "max-w-[520px]" : "max-w-[460px]"}`}>
          <div className="mb-8 block lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>

          {showProgress ? (
            <div className="mb-6 flex gap-1.5" aria-label={`Step ${step + 1} of 5`}>
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    index < step
                      ? "bg-emerald-500"
                      : index === step
                      ? "bg-[#0284C7]"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          ) : null}

          <div className="card p-8 rounded-2xl border hairline bg-white shadow-sm">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-[11px] font-semibold text-sky-700">
              {PillIcon ? <PillIcon size={12} /> : null}
              {pill}
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mb-6 mt-1 text-xs text-slate-500 leading-relaxed">{lead}</p>
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export { OnboardingActions } from "@/components/onboarding/ui";
