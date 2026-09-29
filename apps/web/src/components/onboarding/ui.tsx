import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";

const controlClass =
  "w-full rounded-lg border border-[#CBD5E1] border-b-[#94A3B8] bg-white px-[13px] py-[10px] text-[14px] text-ink-900 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] outline-none transition duration-150 placeholder:text-ink-400 focus:border-[#0284C7] focus:shadow-[0_0_0_1px_#0284C7,0_0_0_4px_rgba(2,132,199,0.12)]";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label?: ReactNode;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label ? (
        <div className="mb-[7px] text-[13px] font-semibold text-ink-700">
          {label}
          {hint ? <span className="font-normal text-ink-400"> {hint}</span> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Control(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function SelectControl(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function TextAreaControl(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlClass} min-h-[78px] resize-y ${props.className ?? ""}`} />;
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-[9px]">{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-[8px] text-[13px] transition duration-150 active:translate-y-[1px] ${
        active
          ? "border-[#0284C7] bg-sky-50 font-semibold text-[#0284C7] shadow-sm ring-1 ring-[#0284C7]/20"
          : "border-[#CBD5E1] bg-white font-medium text-ink-700 hover:border-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`btn btn-primary inline-flex w-full items-center justify-center gap-2 rounded-lg !bg-[#0284C7] hover:!bg-[#0369A1] px-[22px] py-[12px] text-[14.5px] font-semibold !text-white transition duration-150 shadow-sm active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="btn btn-ghost inline-flex shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] border-b-[#94A3B8] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-150 hover:bg-slate-50 max-sm:w-full"
    >
      {children}
    </Link>
  );
}

export function SubtleButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`btn btn-quiet inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition duration-150 hover:bg-slate-100 disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  tone = "brand",
  children,
}: {
  tone?: "brand" | "ok" | "due" | "over" | "neutral";
  children: ReactNode;
}) {
  const tones = {
    brand: "bg-sky-50 text-[#0284C7] [&_.dot]:bg-[#0284C7]",
    ok: "bg-ok-050 text-[#0f6b3a] [&_.dot]:bg-ok-500",
    due: "bg-due-050 text-[#8a5a06] [&_.dot]:bg-due-500",
    over: "bg-over-050 text-[#9b2020] [&_.dot]:bg-over-500",
    neutral: "bg-canvas-2 text-ink-700 [&_.dot]:bg-ink-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-semibold ${tones[tone]}`}>
      <span className="dot h-[7px] w-[7px] rounded-full" />
      {children}
    </span>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 mb-1 text-[13px] font-medium text-over-500">{children}</p>;
}

export function LegalNote({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[12px] leading-relaxed text-ink-400">{children}</p>;
}

export function OnboardingActions({
  backHref,
  children,
  className = "mt-7",
}: {
  backHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 max-sm:flex-col max-sm:items-stretch ${className}`}>
      {backHref ? <GhostButton href={backHref}>Back</GhostButton> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
