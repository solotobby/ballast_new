"use client";

export function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div
      className="staff-ring"
      style={{ background: `conic-gradient(#1f9d57 0% ${pct}%, #eef2f7 ${pct}% 100%)` }}
    >
      <div className="hole" />
      <div className="ctr">
        <b>
          {done}/{total}
        </b>
        <span>Checks</span>
      </div>
    </div>
  );
}
