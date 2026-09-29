"use client";

import type { Organisation } from "@/lib/api";
import { sectorLabel } from "@/lib/compliance";
import { initials } from "@/lib/user";
import type { PreviewRow } from "./share-scope";
import { IconDownload, IconLive, IconShield, IconShieldVerified } from "./share-icons";

const BADGE_TONE: Record<PreviewRow["tone"], string> = {
  ok: "bg-ok-050 text-[#0f6b3a] [&_.dot]:bg-ok-500",
  due: "bg-due-050 text-[#8a5a06] [&_.dot]:bg-due-500",
  over: "bg-over-050 text-[#9b2020] [&_.dot]:bg-over-500",
  gap: "bg-gap-050 text-[#4c3596] [&_.dot]:bg-gap-500",
  brand: "bg-brand-050 text-brand-600 [&_.dot]:bg-brand-500",
};

function StatusBadge({ tone, children }: { tone: PreviewRow["tone"]; children: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-semibold ${BADGE_TONE[tone]}`}>
      <span className="dot h-[7px] w-[7px] rounded-full" />
      {children}
    </span>
  );
}

export function PassportCard({
  org,
  rows,
  compact = false,
}: {
  org: Pick<Organisation, "name" | "sector" | "siteCount">;
  rows: PreviewRow[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-2">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-800 to-navy-700 px-5 py-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(31,157,87,0.35),transparent_70%)]" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-[17px] font-extrabold text-white">
            {initials(org.name, org.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-bold">{org.name}</h3>
            <p className="text-[12px] text-[#c3d2e3]">
              {sectorLabel(org.sector)}
              {org.siteCount > 1 ? ` · ${org.siteCount} sites` : ""}
            </p>
          </div>
        </div>
        <div className="relative mt-3.5 inline-flex items-center gap-2 rounded-[9px] border border-[rgba(31,157,87,0.5)] bg-[rgba(31,157,87,0.2)] px-2.5 py-1.5 text-[12.5px] font-bold text-[#8ff0b6]">
          <IconShieldVerified size={15} className="text-[#8ff0b6]" />
          Compliance verified by Ballast
        </div>
      </div>
      <div className={`px-5 ${compact ? "py-2" : "py-1"}`}>
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 border-b border-line-2 py-3 last:border-b-0">
              <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-canvas-2 text-[15px]">
                {row.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{row.title}</div>
                <div className="mt-0.5 text-[11.5px] text-ink-400">{row.meta}</div>
              </div>
              <StatusBadge tone={row.tone}>{row.badge}</StatusBadge>
            </div>
          ))
        ) : (
          <div className="py-5 text-center text-[13px] text-ink-400">Choose at least one item to share.</div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line-2 px-5 py-3 text-[11.5px] text-ink-400">
        <IconLive size={14} />
        Updates automatically · last verified today
      </div>
    </div>
  );
}

export function PublicPassportPage({
  org,
  title,
  coverage,
  rows,
  onDownload,
}: {
  org: Pick<Organisation, "name" | "sector" | "siteCount">;
  title: string;
  coverage: number;
  rows: PreviewRow[];
  onDownload?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-3">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-700 px-7 py-8 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(31,157,87,0.35),transparent_70%)]" />
        <div className="relative flex items-start gap-4">
          <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-[22px] font-extrabold">
            {initials(org.name, org.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-bold tracking-tight">{org.name}</h2>
            <p className="mt-1 text-[13px] text-[#c3d2e3]">
              {sectorLabel(org.sector)}
              {org.siteCount > 1 ? ` · ${org.siteCount} sites` : ""}
            </p>
            <p className="mt-2 text-[14px] text-[#dbe6f2]">{title}</p>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white">Read-only</span>
        </div>
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-[11px] border border-[rgba(31,157,87,0.5)] bg-[rgba(31,157,87,0.2)] px-3.5 py-2 text-[14px] font-bold text-[#8ff0b6]">
          <IconShieldVerified size={18} className="text-[#8ff0b6]" />
          Compliance verified by Ballast
        </div>
        <div className="relative mt-3.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white">{coverage}% coverage</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white">
            <IconLive size={13} /> Monitored live
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white">Shared by the business</span>
        </div>
      </div>
      <div className="px-7 py-6">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">
          Verified compliance — shared by {org.name}
        </p>
        <div className="space-y-0">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 border-b border-line-2 py-3.5 last:border-b-0">
              <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-canvas-2 text-[19px]">
                {row.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{row.title}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-400">{row.meta}</div>
              </div>
              <StatusBadge tone={row.tone}>{row.badge}</StatusBadge>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3 rounded-2xl bg-gradient-to-br from-ok-050 to-brand-050 p-4">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-white shadow-1">
            <IconShield size={18} className="text-ok-500" />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">Why you can trust this.</span> This is not a self-declared PDF — it
            is drawn from {org.name}&apos;s live evidence in Ballast. Status updates as compliance changes. You are viewing
            only what the business chose to share.
          </p>
        </div>
        {onDownload ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-ok-500 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#188047]"
            >
              <IconDownload size={15} />
              Download compliance pack
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function QrPlaceholder() {
  const n = 25;
  const size = 150;
  const cell = size / n;
  const cells: string[] = [];

  function isFinder(x: number, y: number) {
    const inBox = (bx: number, by: number) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
    return inBox(0, 0) || inBox(n - 7, 0) || inBox(0, n - 7);
  }

  function finderOn(x: number, y: number) {
    const rel = (bx: number, by: number) => {
      const rx = x - bx;
      const ry = y - by;
      const ring = rx === 0 || rx === 6 || ry === 0 || ry === 6;
      const core = rx >= 2 && rx <= 4 && ry >= 2 && ry <= 4;
      return ring || core;
    };
    if (x < 7 && y < 7) return rel(0, 0);
    if (x >= n - 7 && y < 7) return rel(n - 7, 0);
    if (x < 7 && y >= n - 7) return rel(0, n - 7);
    return false;
  }

  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      let on: boolean;
      if (isFinder(x, y)) on = finderOn(x, y);
      else on = (x * 7 + y * 13 + x * y * 3) % 5 < 2;
      if (on) {
        cells.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" rx="${cell * 0.2}" fill="#0b1a2b"/>`);
      }
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 text-center">
      <svg width="150" height="150" viewBox={`0 0 ${size} ${size}`} className="mx-auto mb-2" aria-hidden>
        <rect width={size} height={size} fill="#fff" />
        <g dangerouslySetInnerHTML={{ __html: cells.join("") }} />
      </svg>
      <p className="text-[12px] text-ink-400">Scan to open the profile</p>
    </div>
  );
}
