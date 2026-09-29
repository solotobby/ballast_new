"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EvidenceRecord, LogEntry, Obligation } from "@/lib/api";
import { kindLabel, searchApp, type SearchResult } from "@/lib/search";
import { IconSearch } from "./nav-icons";

export function AppSearch({
  obligations,
  evidence,
  logs,
}: {
  obligations: Obligation[];
  evidence: EvidenceRecord[];
  logs: LogEntry[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchApp(query, obligations, evidence, logs),
    [query, obligations, evidence, logs],
  );

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function onSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    setMobileOpen(false);
  }

  function ResultsList({ items }: { items: SearchResult[] }) {
    if (query.trim().length < 2) {
      return <p className="px-4 py-3 text-[13px] text-ink-400">Type at least 2 characters to search.</p>;
    }
    if (items.length === 0) {
      return <p className="px-4 py-3 text-[13px] text-ink-400">No matches in obligations, evidence or logbook.</p>;
    }
    return (
      <ul className="max-h-[320px] overflow-y-auto py-1">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <Link
              href={item.href}
              onClick={() => onSelect(item)}
              className="flex gap-3 px-4 py-2.5 hover:bg-canvas"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-canvas-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                {kindLabel(item.kind)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-ink-800">{item.title}</span>
                <span className="block truncate text-[12px] text-ink-400">{item.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const input = (
    <input
      type="search"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      placeholder="Search obligations, evidence, logs…"
      className="w-full rounded-full border border-line bg-canvas py-2 pl-9 pr-3 text-[14px] outline-none focus:border-brand-500 focus:bg-white"
    />
  );

  return (
    <>
      <div ref={rootRef} className="relative ml-auto hidden w-[280px] md:block">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
        {input}
        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--sh-3)]">
            <ResultsList items={results} />
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="relative ml-auto grid h-[38px] w-[38px] place-items-center rounded-[10px] text-ink-500 hover:bg-canvas md:hidden"
        aria-label="Search"
      >
        <IconSearch />
      </button>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[62] bg-navy-900/45 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close search"
          />
          <div className="fixed inset-x-4 top-4 z-[63] rounded-[16px] border border-line bg-white p-4 shadow-[var(--sh-3)] md:hidden">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
              {input}
            </div>
            <div className="mt-3 overflow-hidden rounded-[12px] border border-line-2">
              <ResultsList items={results} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
