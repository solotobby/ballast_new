"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Invite, LogEntry, Obligation } from "@/lib/api";
import { buildNotifications, notificationToneClass, type AppNotification } from "@/lib/notifications";
import { IconBell } from "./nav-icons";

export function NotificationsPanel({
  obligations,
  logs,
  invites,
}: {
  obligations: Obligation[];
  logs: LogEntry[];
  invites: Invite[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const notifications = buildNotifications(obligations, logs, invites);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-[38px] w-[38px] place-items-center rounded-[10px] text-ink-500 hover:bg-canvas"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <IconBell />
        {notifications.length > 0 ? (
          <span className="absolute right-[7px] top-[7px] grid min-h-[16px] min-w-[16px] place-items-center rounded-full border-2 border-white bg-over-500 px-1 text-[10px] font-bold text-white">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--sh-3)]">
          <div className="flex items-center justify-between border-b border-line-2 px-4 py-3">
            <h3 className="text-[14px] font-semibold">Notifications</h3>
            <span className="text-[12px] text-ink-400">{notifications.length} active</span>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[14px] font-semibold text-ink-700">All clear</p>
              <p className="mt-1 text-[13px] text-ink-500">No overdue duties, pending confirmations or invites right now.</p>
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto divide-y divide-line-2">
              {notifications.map((item) => (
                <NotificationRow key={item.id} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
          <div className="border-t border-line-2 px-4 py-2.5">
            <Link
              href="/app/obligations"
              onClick={() => setOpen(false)}
              className="text-[13px] font-semibold text-brand-600"
            >
              View obligations →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, onNavigate }: { item: AppNotification; onNavigate: () => void }) {
  return (
    <li>
      <Link href={item.href} onClick={onNavigate} className="flex gap-3 px-4 py-3 hover:bg-canvas">
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-[13px] font-bold ${notificationToneClass(item.tone)}`}
        >
          !
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-[13.5px] font-semibold text-ink-800">{item.title}</span>
            {item.timeLabel ? <span className="shrink-0 text-[11px] text-ink-400">{item.timeLabel}</span> : null}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">{item.body}</span>
        </span>
      </Link>
    </li>
  );
}
