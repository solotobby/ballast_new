"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OpsApiError, opsClient } from "@/lib/ops-api";

export function OpsSignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState("ops@ballast.internal");
  const [password, setPassword] = useState("ballastops");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    opsClient
      .me()
      .then(({ session }) => {
        if (session) router.replace("/ops");
      })
      .catch(() => undefined);
  }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await opsClient.signIn(username, password);
      router.replace("/ops");
    } catch (err) {
      setError(err instanceof OpsApiError ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  function handleAutofill() {
    setUsername("ops@ballast.internal");
    setPassword("ballastops");
    setError(null);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#111318] px-4 py-12 overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Ambient sapphire blue glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[780px] h-[580px] opacity-50 blur-3xl rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(2, 132, 199, 0.3) 0%, rgba(14, 165, 233, 0.15) 40%, transparent 70%)"
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        {/* Brand Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Blue Squircle Sparkle Brand Icon */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] shadow-sm">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-white">
                <path
                  d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-tight text-slate-900 font-sans">Ballast Ops</h1>
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-white uppercase">
                  PRO
                </span>
              </div>
              <p className="text-[12px] text-slate-500 font-medium">Internal Administration Console</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0284C7] animate-pulse" />
            TIER 3
          </div>
        </div>

        {/* Security & Audit Notice */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-[12.5px] text-slate-600 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0284C7]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Statutory Audit Trail Active</span>
          </div>
          <p className="text-slate-500 text-[11.5px]">
            Tenant data access is logged and audited under UK GDPR / DPA 2018. Least-privilege role policies apply.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-semibold text-slate-700">Ops username</label>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-[11px] font-mono font-medium text-[#0284C7] hover:underline"
              >
                Autofill test credentials
              </button>
            </div>
            <input
              type="text"
              className="w-full rounded-lg border border-[#CBD5E1] border-b-[#94A3B8] bg-white px-3.5 py-2.5 text-[14px] text-slate-900 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] outline-none transition duration-150 placeholder:text-slate-400 focus:border-[#0284C7] focus:shadow-[0_0_0_1px_#0284C7,0_0_0_4px_rgba(2,132,199,0.12)] font-mono text-[13px]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-[#CBD5E1] border-b-[#94A3B8] bg-white px-3.5 py-2.5 text-[14px] text-slate-900 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] outline-none transition duration-150 placeholder:text-slate-400 focus:border-[#0284C7] focus:shadow-[0_0_0_1px_#0284C7,0_0_0_4px_rgba(2,132,199,0.12)] font-mono text-[13px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[12.5px] font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl !bg-[#0284C7] hover:!bg-[#0369A1] py-3 text-[14px] font-semibold !text-white shadow-md transition active:translate-y-[1px] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {pending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Authenticating console…</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign in to Ops Console</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 border-t border-slate-200/80 pt-4 flex items-center justify-between text-[12px] text-slate-500">
          <Link href="/signin" className="font-semibold text-[#0284C7] hover:text-[#0369A1] transition flex items-center gap-1">
            &larr; Customer Sign In
          </Link>
          <span className="font-mono text-[11px] text-slate-400">UK-West · Prod</span>
        </div>
      </div>
    </div>
  );
}
