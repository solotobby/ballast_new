"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Control, Field, FormError, PrimaryButton } from "@/components/onboarding/ui";
import { Logo } from "@/components/brand/logo";
import { ApiError, client, type InvitePreview } from "@/lib/api";
import { postAuthPath } from "@/lib/staff";

export function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    client
      .previewInvite(token)
      .then(setPreview)
      .catch(() => setError("This invite is no longer available"));
  }, [token]);

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await client.acceptInvite({
        token,
        ...(preview?.requiresPassword ? { name: name.trim() || undefined, password } : {}),
      });
      const [me, org] = await Promise.all([client.me(), client.organisation()]);
      router.push(postAuthPath(me.user, org));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept invite");
    } finally {
      setPending(false);
    }
  }

  if (!preview && !error) {
    return (
      <div className="relative min-h-screen grid place-items-center bg-[#111318] px-5 py-12">
        <div className="h-28 w-full max-w-md animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="relative min-h-screen grid place-items-center bg-[#111318] px-5 py-12 overflow-hidden">
        <div 
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[550px] opacity-50 blur-3xl rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(229, 46, 46, 0.28) 0%, rgba(255, 107, 53, 0.16) 40%, transparent 70%)"
          }}
        />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Invite unavailable</h1>
          <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">{error}</p>
          <Link href="/signin" className="mt-6 inline-block text-[14px] font-semibold text-[#E52E2E] hover:text-[#DC2626] transition">
            Sign in &rarr;
          </Link>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="relative min-h-screen grid place-items-center bg-[#111318] px-5 py-12 overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Ambient warm sunset glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[550px] opacity-60 blur-3xl rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(229, 46, 46, 0.28) 0%, rgba(255, 107, 53, 0.16) 40%, transparent 70%)"
        }}
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <Logo className="mb-6" />
        <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#E52E2E]">
            Team invite
          </div>
          <h1 className="mt-2 text-[22px] font-bold tracking-tight text-slate-900">{preview.organisationName}</h1>
          <p className="mt-1 text-[13.5px] text-slate-600">
            Join as <strong className="text-slate-900 font-semibold">{preview.roleLabel}</strong>
            {preview.siteName ? (
              <>
                {" "}
                at <strong className="text-slate-900 font-semibold">{preview.siteName}</strong>
              </>
            ) : null}
          </p>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
          Invited email: <strong className="font-semibold text-slate-900 font-mono">{preview.email}</strong>
        </p>

        <form onSubmit={accept} className="mt-5">
          {preview.requiresPassword ? (
            <>
              <Field label="Your name">
                <Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Tomas Nowak" />
              </Field>
              <Field label="Choose a password">
                <Control
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  minLength={8}
                  required
                />
              </Field>
            </>
          ) : (
            <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600 leading-relaxed">
              An account already exists for this email. Sign in first, then return here to accept — or accept now if
              you&apos;re already signed in as <strong>{preview.email}</strong>.
            </p>
          )}

          <FormError>{error}</FormError>

          <PrimaryButton type="submit" disabled={pending}>
            {pending ? "Joining…" : "Accept invite & continue"}
          </PrimaryButton>
        </form>

        {!preview.requiresPassword ? (
          <Link
            href={`/signin?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(preview.email)}`}
            className="mt-4 block text-center text-[13.5px] font-semibold text-[#E52E2E] hover:text-[#DC2626] transition"
          >
            Sign in with {preview.email}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
