import { AppBadge, StatTile } from "@/components/app/app-ui";

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-canvas shadow-[var(--sh-3)]">
      <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3.5">
        <div>
          <div className="font-mono text-[11px] text-ink-400 uppercase tracking-wider">Governance</div>
          <div className="font-display text-[17px] font-bold tracking-tight text-ink">Dashboard</div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11.5px] font-semibold text-sky-700">
            The Copper Kettle
          </span>
          <AppBadge tone="due">1 needs attention</AppBadge>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 text-[15px] font-bold tracking-tight text-ink">
          Good morning, Rachel
          <span className="mt-0.5 block text-[13px] font-normal text-ink-500">
            Here’s where The Copper Kettle stands right now across both sites.
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="On track" value={8} tone="ok" hint="2 since last week" />
          <StatTile label="Due soon" value={3} tone="due" hint="SFBB diary today" />
          <StatTile label="Overdue" value={1} tone="over" hint="Fire Risk Assessment" />
          <StatTile label="Evidence gaps" value={2} tone="gap" hint="Allergen matrix" />
        </div>

        <div className="grid gap-3.5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card-elevated overflow-hidden">
            <div className="border-b border-line px-4 py-3 font-display text-[14px] font-bold text-ink">Needs your attention</div>
            <ul className="divide-y divide-line">
              <li className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">Fire Risk Assessment reviewed annually</div>
                  <div className="mt-0.5 text-[12.5px] text-ink-500">Fire Safety · Camden · Overdue · 12 days</div>
                </div>
                <AppBadge tone="over">Overdue</AppBadge>
              </li>
              <li className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">Allergen information for all menu items</div>
                  <div className="mt-0.5 text-[12.5px] text-ink-500">Food Safety · All sites · Evidence missing</div>
                </div>
                <AppBadge tone="gap">Evidence gap</AppBadge>
              </li>
              <li className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">HACCP / Safer Food Better Business pack</div>
                  <div className="mt-0.5 text-[12.5px] text-ink-500">Food Safety · Camden · Due today</div>
                </div>
                <AppBadge tone="due">Due soon</AppBadge>
              </li>
            </ul>
          </div>

          <div className="card-obsidian p-5 text-white">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/20 text-xs font-mono font-bold text-sky-400">✦</span>
                <div className="font-display text-[13.5px] font-bold text-white">Ballast Intelligence</div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300">Live</span>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-300">
              Chilled deliveries have been rejected <span className="font-semibold text-white">twice this week</span> at
              Camden. Recurring supplier issue — not a kitchen failure.
            </p>
            <div className="mt-3.5 rounded-xl border border-white/10 bg-white/5 p-3 text-[12.5px] leading-relaxed text-slate-200">
              <span className="font-semibold text-sky-300">Recommended:</span> raise a temperature-on-arrival clause and
              switch the AM slot.
            </div>
            <div className="mt-3 font-mono text-[11px] text-slate-400">Traceable to logbook #7, #12 · Rules v2026.3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
