"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, client } from "@/lib/api";

export function SignupForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("The Copper Kettle Ltd");
  const [email, setEmail] = useState("owner@copperkettle.co");
  const [password, setPassword] = useState("prototype");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await client.signUp({ businessName, email, password });
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Business name</label>
        <input
          className="field"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Your business name"
          required
        />
      </div>

      <div>
        <label className="label">Work email</label>
        <input
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="owner@copperkettle.co"
          required
        />
      </div>

      <div>
        <label className="label">Password</label>
        <input
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Create a password"
          minLength={6}
          required
        />
      </div>

      {error ? (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-lg w-full !bg-[#E52E2E] hover:!bg-[#DC2626] !text-white font-semibold shadow-xs disabled:opacity-60 transition"
        >
          {pending ? "Creating account…" : "Create account & set up business"}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-emerald-700 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Instant access · Email verification bypassed</span>
      </div>
    </form>
  );
}

