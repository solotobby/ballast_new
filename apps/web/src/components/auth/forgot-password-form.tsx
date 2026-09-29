"use client";

import Link from "next/link";
import { useState } from "react";
import { Control, Field, PrimaryButton } from "@/components/onboarding/ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("rachel@copperkettle.co.uk");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [resent, setResent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
    }, 400);
  }

  function handleResend() {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  if (submitted) {
    return (
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E52E2E] ring-1 ring-[#E52E2E]/20">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-bold text-ink-900 tracking-tight">Check your inbox</h3>
          <p className="mt-1 text-sm text-ink-500">
            We sent instructions to <strong className="font-semibold text-ink-900 font-mono">{email}</strong>. The link expires in 15 minutes.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-canvas-2 p-3.5 text-xs text-ink-500 leading-relaxed">
          If you don&apos;t see an email within 60 seconds, check your spam or promotions folder, or try resending.
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <span className="font-semibold">Interactive Prototype:</span>{" "}
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="font-bold underline hover:text-amber-950">
            Click here to simulate opening the reset email link &rarr;
          </Link>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resent}
            className="w-full rounded-lg border border-line bg-white py-2.5 text-xs font-semibold text-ink-700 hover:bg-canvas-2 transition disabled:opacity-50"
          >
            {resent ? "Reset email re-sent!" : "Resend email"}
          </button>
          <Link
            href="/signin"
            className="block w-full py-2 text-center text-xs font-semibold text-ink-400 hover:text-ink-700 transition"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Work email address">
        <Control
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="name@business.co.uk"
          required
        />
      </Field>

      <div className="mt-6">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sending instructions…" : "Send reset link"}
        </PrimaryButton>
      </div>

      <div className="mt-6 border-t border-line pt-4 text-center">
        <Link href="/signin" className="text-xs font-semibold text-[#E52E2E] hover:text-[#DC2626]">
          &larr; Remember your password? Sign in
        </Link>
      </div>
    </form>
  );
}
