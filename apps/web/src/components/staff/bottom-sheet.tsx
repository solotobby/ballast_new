"use client";

import type { ReactNode } from "react";
import { IconClose } from "./icons";

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button type="button" aria-label="Close sheet" className="staff-sheet-bg show" onClick={onClose} />
      <div className="staff-sheet show">{children}</div>
    </>
  );
}

export function SheetGrip() {
  return <div className="grip" />;
}

export function SheetHeader({
  emoji,
  category,
  title,
  subtitle,
  onClose,
  noIcon,
}: {
  emoji?: string;
  category?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  noIcon?: boolean;
}) {
  return (
    <>
      <SheetGrip />
      <div className="staff-sheet-h">
        {!noIcon && emoji ? <div className={`sic ${category ?? "staff-ic-hs"}`}>{emoji}</div> : null}
        <div style={{ flex: 1 }}>
          <h3>{title}</h3>
          {subtitle ? <div className="staff-muted staff-tiny">{subtitle}</div> : null}
        </div>
        <button type="button" className="cls" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </>
  );
}

export function SheetBody({ children, compactTop }: { children: ReactNode; compactTop?: boolean }) {
  return <div className={`staff-sheet-b${compactTop ? " pt-sm" : ""}`}>{children}</div>;
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="staff-sheet-f">{children}</div>;
}
