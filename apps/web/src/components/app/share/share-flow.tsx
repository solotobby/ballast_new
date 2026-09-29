"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, client, type Obligation, type Organisation, type ShareGrant } from "@/lib/api";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBadge,
  IconCheck,
  IconCopy,
  IconDownload,
  IconEye,
  IconLink,
  IconLock,
  IconMail,
  IconSend,
  IconShieldVerified,
} from "./share-icons";
import { PassportCard, PublicPassportPage, QrPlaceholder } from "./share-passport";
import {
  SHARE_SCOPE_ITEMS,
  coverageFor,
  defaultScopeSelection,
  obligationsForScope,
  previewRows,
  type ShareMethod,
} from "./share-scope";

type Step = 0 | 1 | 2;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-6 w-10 shrink-0 rounded-full transition duration-200 ${on ? "bg-brand-500" : "bg-[#cdd5df]"}`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-1 transition duration-200 ${on ? "left-[19px]" : "left-[3px]"}`}
      />
    </button>
  );
}

function ScopeRow({
  item,
  on,
  onToggle,
}: {
  item: (typeof SHARE_SCOPE_ITEMS)[number];
  on: boolean;
  onToggle?: () => void;
}) {
  if (item.private) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line-2 bg-[#fbfbfc] px-3.5 py-3">
        <div className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-[#cdd5df] opacity-50">
          <span className="absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-1" />
        </div>
        <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-canvas-2 text-[17px]">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">
            {item.name}{" "}
            <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-canvas-2 px-2 py-0.5 text-[11px] font-bold text-ink-500">
              <IconLock size={12} /> Always private
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{item.description}</p>
        </div>
      </div>
    );
  }

  if (item.locked) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line-2 bg-canvas px-3.5 py-3">
        <div className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-ok-500">
          <span className="absolute left-[19px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-1" />
        </div>
        <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-canvas-2 text-[17px]">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">
            {item.name}{" "}
            <span className="ml-1 rounded-md bg-ok-050 px-2 py-0.5 text-[11px] font-bold text-[#0f6b3a]">Always included</span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{item.description}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition duration-150 ${
        on ? "border-brand-500 bg-brand-050" : "border-line hover:border-[#c9d2dc]"
      }`}
    >
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition duration-200 ${on ? "bg-brand-500" : "bg-[#cdd5df]"}`}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-1 transition duration-200 ${on ? "left-[19px]" : "left-[3px]"}`}
        />
      </span>
      <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-canvas-2 text-[17px]">{item.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{item.name}</div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{item.description}</p>
      </div>
    </button>
  );
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function ShareFlow() {
  const [step, setStep] = useState<Step>(0);
  const [method, setMethod] = useState<ShareMethod>("link");
  const [org, setOrg] = useState<Organisation | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [shares, setShares] = useState<ShareGrant[]>([]);
  const [selection, setSelection] = useState(defaultScopeSelection);
  const [recipients, setRecipients] = useState<string[]>(["procurement@example.co.uk"]);
  const [recipientInput, setRecipientInput] = useState("");
  const [message, setMessage] = useState(
    "Hi — ahead of our tender, here’s our live, independently-verified compliance. Everything you need to onboard us, no forms to chase.",
  );
  const [expiry, setExpiry] = useState("90 days");
  const [allowDownload, setAllowDownload] = useState(true);
  const [notifyOpen, setNotifyOpen] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<ShareGrant | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([client.organisation(), client.listObligations(), client.listShares()])
      .then(([organisation, register, existing]) => {
        setOrg(organisation);
        setObligations(register);
        setShares(existing);
      })
      .catch(() => setError("Could not load share tools."));
  }, []);

  const sharedObligations = useMemo(
    () => obligationsForScope(selection, obligations),
    [selection, obligations],
  );
  const coverage = useMemo(() => coverageFor(sharedObligations), [sharedObligations]);
  const rows = useMemo(() => previewRows(selection, obligations, coverage), [selection, obligations, coverage]);

  const shareUrl =
    createdShare && typeof window !== "undefined"
      ? `${window.location.origin}/p/${createdShare.token}`
      : createdShare
        ? `/p/${createdShare.token}`
        : "";

  const embedCode = shareUrl
    ? `<a href="${shareUrl}">\n  <img src="${typeof window !== "undefined" ? window.location.origin : ""}/badge.svg" alt="Ballast Verified" />\n</a>`
    : "";

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 2400);
  }

  function toggleScope(id: string) {
    setSelection((current) => ({ ...current, [id]: !current[id] }));
  }

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase();
    if (!email || recipients.includes(email)) return;
    setRecipients((current) => [...current, email]);
    setRecipientInput("");
  }

  async function createShare() {
    if (sharedObligations.length === 0) {
      setError("Pick at least one item to share.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const titles = {
        email: "Compliance summary",
        link: "Public compliance page",
        badge: "Ballast verified badge",
      };
      const share = await client.createShare({
        title: titles[method],
        obligationIds: sharedObligations.map((item) => item.id),
      });
      setCreatedShare(share);
      const existing = await client.listShares();
      setShares(existing);
      setStep(2);
      showToast(
        method === "email"
          ? `Sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`
          : method === "badge"
            ? "Badge generated"
            : "Share link created",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the share link");
    } finally {
      setPending(false);
    }
  }

  if (!org) {
    return error ? <p className="text-sm font-medium text-over-500">{error}</p> : <p className="text-sm text-ink-500">Loading share tools…</p>;
  }

  if (step === 0) {
    return (
      <div>
        <div className="mb-2">
          <h2 className="text-[26px] font-bold tracking-tight">Share your compliance — before anyone asks</h2>
          <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-ink-500">
            Don&apos;t wait for a client to send you a form. Put your verified, always-current compliance in front of the
            people who decide whether to work with you.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(
            [
              {
                id: "email" as const,
                icon: IconMail,
                tone: "bg-brand-050 text-brand-500",
                title: "Send to a client or prospect",
                body: "Email a live, read-only compliance summary straight to a buyer, main contractor or prospect you're pitching.",
              },
              {
                id: "link" as const,
                icon: IconLink,
                tone: "bg-teal-050 text-teal-500",
                title: "Create a public compliance page",
                body: "Generate a shareable link and QR code to your verified profile — perfect for tenders, directories and bids.",
              },
              {
                id: "badge" as const,
                icon: IconBadge,
                tone: "bg-[#e6eaf0] text-navy-800",
                title: "Add a trust badge",
                body: "Embed a “Ballast Verified” badge on your website or email signature that always reflects your live status.",
              },
            ] as const
          ).map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setMethod(card.id);
                setStep(1);
              }}
              className="rounded-2xl border border-line bg-white p-5 text-left shadow-1 transition duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-2"
            >
              <div className={`mb-3.5 grid h-12 w-12 place-items-center rounded-[14px] ${card.tone}`}>
                <card.icon />
              </div>
              <h3 className="text-[16px] font-semibold">{card.title}</h3>
              <p className="mt-1.5 min-h-[56px] text-[13px] leading-relaxed text-ink-500">{card.body}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-600">
                {card.id === "email" ? "Compose" : card.id === "badge" ? "Get badge" : "Create link"}
                <IconArrowRight />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3.5 rounded-2xl bg-gradient-to-br from-ok-050 to-brand-050 px-5 py-4">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-white shadow-1">
            <IconShieldVerified size={20} className="text-ok-500" />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">Why share unprompted?</span> Suppliers who can prove compliance on
            demand win more work and onboard faster. Sharing is scoped and revocable — you choose exactly what&apos;s visible,
            and it updates itself as your compliance changes.
          </p>
        </div>

        {shares.length > 0 ? (
          <div className="mt-8">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Active shares</p>
            <div className="space-y-2">
              {shares.slice(0, 4).map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
                  <div>
                    <div className="text-[13.5px] font-semibold">{share.title}</div>
                    <div className="text-[12px] text-ink-400">
                      {share.revokedAt ? "Revoked" : "Live"} · {new Date(share.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  {!share.revokedAt ? (
                    <a href={`/p/${share.token}`} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-brand-600">
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 1) {
    const methodTitle = {
      email: "Send to a client or prospect",
      link: "Create a public compliance page",
      badge: "Add a trust badge",
    }[method];

    return (
      <div>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-ink-400 hover:text-brand-600"
        >
          <IconArrowLeft /> Choose a different way to share
        </button>
        <div className="mb-5">
          <h2 className="text-[26px] font-bold tracking-tight">{methodTitle}</h2>
          <p className="mt-2 max-w-[620px] text-[15px] text-ink-500">
            Pick exactly what to reveal. Anything you don&apos;t switch on stays private — recipients only ever see what you
            choose.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">What to share</p>
            <div className="mt-3 space-y-2.5">
              {SHARE_SCOPE_ITEMS.map((item) => (
                <ScopeRow
                  key={item.id}
                  item={item}
                  on={Boolean(selection[item.id])}
                  onToggle={item.private || item.locked ? undefined : () => toggleScope(item.id)}
                />
              ))}
            </div>

            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">
              {method === "email" ? "Who to send it to" : "Who can see it"}
            </p>
            {method === "email" ? (
              <div className="mt-3">
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">Recipient emails</span>
                  <div className="flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_var(--brand-050)]"
                      placeholder="name@company.co.uk"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRecipient();
                        }
                      }}
                    />
                    <button type="button" onClick={addRecipient} className="rounded-lg bg-canvas-2 px-3.5 py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-[#e2e8f0]">
                      Add
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {recipients.map((email) => (
                      <span key={email} className="inline-flex items-center gap-2 rounded-lg bg-brand-050 px-2.5 py-1.5 text-[13px] font-semibold text-brand-600">
                        {email}
                        <button type="button" onClick={() => setRecipients((current) => current.filter((item) => item !== email))} aria-label={`Remove ${email}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">
                    Message <span className="font-normal text-ink-400">(optional)</span>
                  </span>
                  <textarea
                    className="min-h-[70px] w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_var(--brand-050)]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex rounded-[10px] bg-canvas-2 p-1">
                  <button
                    type="button"
                    onClick={() => setDiscoverable(false)}
                    className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold ${!discoverable ? "bg-white text-ink-900 shadow-1" : "text-ink-500"}`}
                  >
                    Anyone with the link
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscoverable(true)}
                    className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold ${discoverable ? "bg-white text-ink-900 shadow-1" : "text-ink-500"}`}
                  >
                    Public & discoverable
                  </button>
                </div>
                <p className="mt-2 px-0.5 text-[12px] text-ink-400">
                  {discoverable
                    ? "Listed on your public Ballast profile so buyers and directories can find you."
                    : "Only people you send the link to can open it — not indexed or listed."}
                </p>
              </div>
            )}

            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Options</p>
            <div className="mt-2 divide-y divide-line-2">
              {(
                [
                  ["Allow PDF download", "Recipients can save a compliance pack", allowDownload, () => setAllowDownload((v) => !v)],
                  ["Notify me when it's opened", "Get a ping the moment someone views it", notifyOpen, () => setNotifyOpen((v) => !v)],
                ] as const
              ).map(([title, desc, on, toggle]) => (
                <div key={title} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{title}</div>
                    <div className="text-[12px] text-ink-400">{desc}</div>
                  </div>
                  <Toggle on={on} onToggle={toggle} />
                </div>
              ))}
              <div className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">Link expires</div>
                  <div className="text-[12px] text-ink-400">Auto-revokes after this period</div>
                </div>
                <select
                  className="w-[130px] rounded-lg border border-line px-3 py-2 text-sm"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                >
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>No expiry</option>
                </select>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm font-medium text-over-500">{error}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink-700 hover:bg-canvas"
              >
                <IconEye /> Preview public page
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={createShare}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-[15px] font-semibold text-white shadow-1 hover:bg-brand-600 disabled:opacity-60"
              >
                {method === "email" ? (
                  <>
                    <IconSend /> {pending ? "Sending…" : "Send now"}
                  </>
                ) : method === "badge" ? (
                  <>
                    <IconBadge size={18} /> {pending ? "Generating…" : "Generate badge"}
                  </>
                ) : (
                  <>
                    <IconLink size={18} /> {pending ? "Creating…" : "Create share link"}
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-ink-400">
              <IconLock size={14} /> Encrypted, scoped and revocable. Every share is recorded in your audit trail.
            </p>
          </div>

          <div className="lg:sticky lg:top-20">
            <p className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">
              <IconEye size={14} /> Live preview
            </p>
            <PassportCard org={org} rows={rows} />
          </div>
        </div>

        {previewOpen ? (
          <div className="fixed inset-0 z-50 overflow-auto bg-[radial-gradient(900px_460px_at_20%_-10%,rgba(31,111,235,0.14),transparent_55%),radial-gradient(800px_500px_at_90%_110%,rgba(15,158,142,0.14),transparent_55%),var(--bg)]">
            <div className="sticky top-0 flex h-[52px] items-center gap-3 bg-navy-900 px-5 text-white">
              <span className="inline-flex items-center gap-2 text-[13px] text-[#c3d2e3]">
                <IconEye size={15} className="text-[#7fe8da]" /> Preview — this is what recipients see
              </span>
              <button type="button" onClick={() => setPreviewOpen(false)} className="ml-auto grid h-[34px] w-[34px] place-items-center rounded-lg text-[#c3d2e3] hover:bg-white/10" aria-label="Close preview">
                ×
              </button>
            </div>
            <div className="mx-auto max-w-[760px] px-5 py-8">
              <PublicPassportPage org={org} title="Compliance passport" coverage={coverage} rows={rows} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const confirmTitle = {
    email: "Sent — before they even asked",
    link: "Your compliance page is live",
    badge: "Your trust badge is ready",
  }[method];

  const confirmSub = {
    email: `Your live compliance summary is on its way to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}. They can view it instantly — no account, no forms.`,
    link: "Share this link anywhere — tenders, your website, directories. It always shows your current, verified status.",
    badge: "Drop this badge on your site or email signature. It links to your live profile and updates itself.",
  }[method];

  return (
    <div>
      <div className="mx-auto max-w-[820px] rounded-2xl border border-line bg-white p-7 shadow-1">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-[76px] w-[76px] place-items-center rounded-full bg-ok-050">
            <IconCheck size={38} className="text-ok-500" />
          </div>
          <h2 className="text-[25px] font-bold tracking-tight">{confirmTitle}</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-[15px] leading-relaxed text-ink-500">{confirmSub}</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Public link</p>
            <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-canvas px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-700">{shareUrl}</span>
              <button
                type="button"
                onClick={() => copyText(shareUrl).then(() => showToast("Link copied"))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-canvas-2 px-2.5 py-1.5 text-[13px] font-semibold text-ink-700 hover:bg-[#e2e8f0]"
              >
                <IconCopy /> Copy
              </button>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas">
                <IconEye /> View page
              </a>
              <button type="button" onClick={() => showToast("Compliance pack downloaded")} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas">
                <IconDownload /> Download pack
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Website / email badge</p>
              <div className="inline-flex items-center gap-2.5 rounded-[10px] border border-line bg-white px-3.5 py-2 shadow-1">
                <div className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-ok-050 text-ok-500">
                  <IconShieldVerified size={15} />
                </div>
                <div className="text-[12.5px] leading-tight">
                  <div className="font-bold">Ballast Verified</div>
                  <div className="text-[11px] text-ink-400">
                    {org.name} · {coverage >= 80 ? "compliant" : "in review"}
                  </div>
                </div>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-navy-900 p-3 text-[12px] leading-relaxed text-[#c9d6e5]">{embedCode}</pre>
              <button
                type="button"
                onClick={() => copyText(embedCode).then(() => showToast("Embed code copied"))}
                className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-canvas-2 px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-[#e2e8f0]"
              >
                <IconCopy /> Copy embed code
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">QR code</p>
            <QrPlaceholder />
            <div className="mt-4 rounded-xl bg-ok-050 p-3.5">
              <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-[#0f6b3a]">
                <IconShieldVerified size={15} className="text-[#0f6b3a]" /> Scoped & revocable
              </div>
              <p className="text-[12px] leading-relaxed text-[#0f6b3a]">
                Showing {rows.length} items. Revoke anytime — access stops immediately and it&apos;s logged in your audit trail.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">
            {method === "email" ? "Delivery & views" : "Views"}
          </p>
          <div className="divide-y divide-line-2">
            {(method === "email"
              ? recipients.map((email, index) => ({
                  who: email,
                  av: email.slice(0, 2).toUpperCase(),
                  color: ["#1f6feb", "#0f9e8e", "#7b5bd6"][index % 3],
                  status: index === 0 ? "Opened · just now" : "Delivered",
                  tone: index === 0 ? "ok" : "neutral",
                }))
              : [
                  { who: "Link ready to share", av: "LK", color: "#475467", status: "Live", tone: "ok" as const },
                  { who: "Anonymous visitor", av: "··", color: "#98a2b3", status: "Awaiting first view", tone: "neutral" as const },
                ]
            ).map((row) => (
              <div key={row.who} className="flex items-center gap-3 py-3">
                <div className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[12px] font-bold text-white" style={{ background: row.color }}>
                  {row.av}
                </div>
                <div className="min-w-0 flex-1 text-[13.5px] font-semibold">{row.who}</div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                    row.tone === "ok" ? "bg-ok-050 text-[#0f6b3a]" : "bg-canvas-2 text-ink-600"
                  }`}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setCreatedShare(null);
            }}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink-700 hover:bg-canvas"
          >
            Share with someone else
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-[15px] font-semibold text-white hover:bg-brand-600"
          >
            Manage my shares <IconArrowRight />
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-navy-900 px-5 py-3 text-[13.5px] font-medium text-white shadow-3">
          <IconCheck size={18} className="text-[#7fe8da]" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
