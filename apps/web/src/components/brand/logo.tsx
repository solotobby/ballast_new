export function Logo({
  size = 32,
  wordmark = true,
  className = "",
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className || "text-slate-900"}`}>
      <div
        className="relative grid place-items-center flex-none bg-[#0284C7] shadow-xs"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
      >
        <svg
          viewBox="0 0 24 24"
          width={Math.round(size * 0.52)}
          height={Math.round(size * 0.52)}
          fill="#FFFFFF"
          aria-hidden
        >
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>
      {wordmark ? (
        <span
          className="font-display font-bold tracking-tight text-slate-900 flex items-center gap-1.5"
          style={{ fontSize: size > 26 ? 18 : 16 }}
        >
          <span>Ballast</span>
          <span className="font-mono rounded border border-sky-200 bg-sky-50 px-1 py-0.2 text-[9px] font-bold text-sky-700">
            PRO
          </span>
        </span>
      ) : null}
    </span>
  );
}
