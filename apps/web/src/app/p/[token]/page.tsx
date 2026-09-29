"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { PublicPassportPage } from "@/components/app/share/share-passport";
import { IconShield } from "@/components/app/share/share-icons";
import type { PreviewRow } from "@/components/app/share/share-scope";
import { client, type PublicShare } from "@/lib/api";
import { categoryMeta, statusLabel, statusTone } from "@/lib/compliance";

function rowsFromShare(data: PublicShare): PreviewRow[] {
  const rows: PreviewRow[] = [
    {
      id: "status",
      emoji: "✅",
      title: "Compliance verified",
      meta: `${data.coverage}% of shared duties covered · monitored live`,
      badge: data.coverage >= 80 ? "Verified" : "In review",
      tone: data.coverage >= 80 ? "ok" : "due",
    },
  ];

  for (const item of data.obligations) {
    const tone = statusTone(item.status);
    rows.push({
      id: item.title,
      emoji: categoryMeta(item.category).emoji,
      title: item.title,
      meta: `${item.basis} · ${item.cadence}`,
      badge: statusLabel(item.status),
      tone: tone === "ok" ? "ok" : tone === "due" ? "due" : tone === "over" ? "over" : "gap",
    });
  }

  return rows;
}

export default function PublicSharePage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<PublicShare | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return;
    client
      .publicShare(params.token)
      .then(setData)
      .catch(() => setError("This share link is missing or has been revoked."));
  }, [params.token]);

  const rows = useMemo(() => (data ? rowsFromShare(data) : []), [data]);

  return (
    <div className="min-h-full bg-[radial-gradient(900px_460px_at_20%_-10%,rgba(31,111,235,0.14),transparent_55%),radial-gradient(800px_500px_at_90%_110%,rgba(15,158,142,0.14),transparent_55%),var(--bg)] px-6 py-10">
      <div className="mx-auto w-full max-w-[760px]">
        <Logo />
        {error ? <p className="mt-8 text-sm font-medium text-over-500">{error}</p> : null}
        {!error && !data ? <p className="mt-8 text-sm text-ink-500">Loading this compliance passport…</p> : null}
        {data ? (
          <>
            <div className="mt-8">
              <PublicPassportPage
                org={{
                  name: data.organisationName,
                  sector: data.sector,
                  siteCount: data.siteCount,
                }}
                title={data.title}
                coverage={data.coverage}
                rows={rows}
                onDownload={() => window.print()}
              />
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-[12px] text-ink-400">
              <IconShield size={14} className="text-ink-400" />
              Independently verified & continuously monitored by Ballast ·{" "}
              {new Date(data.createdAt).toLocaleDateString("en-GB")}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
