"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Control, Field, FormError, PrimaryButton } from "@/components/onboarding/ui";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "rachel@copperkettle.co.uk";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strength score
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strengthScore++;
  if (/[^A-Za-z0-9]/.test(password)) strengthScore++;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSuccess(true);
    }, 450);
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-bold text-ink-900 tracking-tight">Password updated</h3>
          <p className="mt-1 text-sm text-ink-500">
            Your new credentials are now active for <strong className="font-semibold text-ink-900 font-mono">{email}</strong>.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/signin"
            className="block w-full rounded-lg !bg-[#E52E2E] py-3 text-center text-sm font-semibold !text-white shadow-sm hover:!bg-[#DC2626] transition"
          >
            Sign in with new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Field
        label={
          <div className="flex items-center justify-between w-full">
            <span>New password</span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs font-mono font-semibold text-[#E52E2E] hover:text-[#DC2626] uppercase"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        }
      >
        <Control
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          required
        />
        {/* Strength indicators */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full w-full transition-colors ${strengthScore >= 1 ? (strengthScore === 1 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
          </div>
          <div className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full w-full transition-colors ${strengthScore >= 2 ? (strengthScore === 2 ? 'bg-emerald-400' : 'bg-emerald-500') : 'bg-slate-200'}`} />
          </div>
          <div className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full w-full transition-colors ${strengthScore >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          </div>
          <span className="text-[10.5px] font-mono font-bold text-slate-400 min-w-[50px] text-right">
            {password.length === 0 ? "SHORT" : strengthScore === 1 ? "WEAK" : strengthScore === 2 ? "MEDIUM" : "STRONG"}
          </span>
        </div>
      </Field>

      <Field label="Confirm new password">
        <Control
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          placeholder="Re-type new password"
          required
        />
      </Field>

      <FormError>{error}</FormError>

      <div className="mt-7">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Updating credentials…" : "Update password"}
        </PrimaryButton>
      </div>

      <div className="mt-5 text-center">
        <Link href="/signin" className="text-xs font-semibold text-ink-400 hover:text-ink-700">
          Cancel and return to sign in
        </Link>
      </div>
    </form>
  );
}
