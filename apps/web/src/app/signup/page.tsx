import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Create your account · Ballast",
  description: "Set up Ballast and see the obligations that apply to your business.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8F9FA]">
      {/* Left: Brand Panel with Sunset Texture Mesh */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-[#111318]">
        {/* Sapphire Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(2, 132, 199, 0.28) 0%, rgba(14, 165, 233, 0.15) 35%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#0284C7] shadow-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#FFFFFF">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="font-display flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
                <span>Ballast</span>
                <span className="font-mono rounded border border-sky-400/40 bg-sky-500/20 px-1 py-0.2 text-[9px] font-bold text-sky-300">
                  PRO
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            <span>Instant Setup Engine</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4 tracking-tight">
            Compliance you can prove from day one.
          </h1>
          <p className="text-[#94A3B8] text-base leading-relaxed">
            Ballast provisions your statutory obligation register automatically. Zero guessing, zero audit backlogs, and no waiting for email verification.
          </p>
          <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
            <div>
              <div className="font-display text-2xl font-bold text-white font-mono">16</div>
              <div className="text-xs text-[#94A3B8] uppercase tracking-wider font-mono mt-0.5">duties mapped</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white font-mono">2</div>
              <div className="text-xs text-[#94A3B8] uppercase tracking-wider font-mono mt-0.5">sites audited</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-sky-400 font-mono">24/7</div>
              <div className="text-xs text-[#94A3B8] uppercase tracking-wider font-mono mt-0.5">continuous audit</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#64748B] font-mono relative z-10">
          UK SME Compliance Operating System · v2.4.0
        </div>
      </div>

      {/* Right: Form Container with Clean White Card */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Logo size={36} />
          </div>

          <div className="card p-8 rounded-2xl shadow-sm border hairline bg-white">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Create your workspace</h2>
              <p className="text-xs text-slate-500 mt-1">
                Instant access — email verification is automatically bypassed.
              </p>
            </div>

            <SignupForm />
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-rose-600 hover:text-rose-700 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
