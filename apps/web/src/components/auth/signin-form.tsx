"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ApiError, client } from "@/lib/api";
import { postAuthPath } from "@/lib/staff";

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const presetEmail = searchParams.get("email") ?? "op@copperkettle.co";

  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("prototype");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await client.signIn({ email, password });
      if (inviteToken) {
        await client.acceptInvite({ token: inviteToken });
      }
      const [me, org] = await Promise.all([client.me(), client.organisation()]);
      router.push(postAuthPath(me.user, org));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {inviteToken ? (
        <p className="rounded-xl bg-sky-50 px-4 py-3 text-[13.5px] text-sky-700 border border-sky-200">
          Sign in with your invited email, then we&apos;ll add you to the team.
        </p>
      ) : null}

      <div>
        <label className="label">Work email</label>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="op@copperkettle.co"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Password</label>
          <Link href="/forgot-password" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
            Forgot password?
          </Link>
        </div>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
          <input type="checkbox" defaultChecked className="rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
          <span>Keep me signed in</span>
        </label>
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
          {pending ? "Signing in…" : inviteToken ? "Sign in & accept invite" : "Sign in"}
        </button>
      </div>
    </form>
  );
}

