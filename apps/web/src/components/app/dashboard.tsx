"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuickLogModal } from "@/components/app/quick-log-modal";
import { client, type LogEntry, type Obligation, type Organisation, type SessionUser } from "@/lib/api";
import { sectorLabel } from "@/lib/compliance";

export interface UnifiedObligation {
  id: string;
  definitionId: string;
  title: string;
  category: string;
  tier: "Sector licensing" | "Universal" | "Data & cyber" | "Employment";
  jurisdiction: string;
  evidence: string;
  cadence: string;
  owner: string;
  status: "ok" | "due" | "overdue" | "na";
  rawStatus: string;
  nextDue: string;
  basis: string;
  source: string;
  why: string;
  actionRequired: string;
  regulatoryAuthority: string;
  formProgress?: {
    percent: number;
    complete: boolean;
    requiredFilled: number;
    requiredTotal: number;
    submissionStatus: string | null;
  } | null;
}

export function deriveRegulatoryAuthority(title: string, basis: string, category: string) {
  const text = `${title} ${basis} ${category}`.toLowerCase();
  if (text.includes("food") || text.includes("hygiene") || text.includes("fsa") || text.includes("allergen") || text.includes("haccp")) {
    return { code: "FSA", label: "Food Standards Agency", tone: "bg-emerald-50 text-emerald-800 border-emerald-300" };
  }
  if (text.includes("gas safe") || text.includes("cp12") || text.includes("gas safety") || text.includes("gas boiler")) {
    return { code: "GAS SAFE", label: "Gas Safe Register", tone: "bg-amber-50 text-amber-800 border-amber-300" };
  }
  if (text.includes("fire") || text.includes("evacuation") || text.includes("smoke")) {
    return { code: "FIRE RESCUE", label: "Fire & Rescue Service", tone: "bg-rose-50 text-rose-800 border-rose-300" };
  }
  if (text.includes("licens") || text.includes("dps") || text.includes("alcohol") || text.includes("late night") || text.includes("council")) {
    return { code: "COUNCIL", label: "Local Licensing Authority", tone: "bg-blue-50 text-blue-800 border-blue-300" };
  }
  if (text.includes("ico") || text.includes("gdpr") || text.includes("data protection") || text.includes("privacy") || text.includes("cctv")) {
    return { code: "ICO", label: "Information Commissioner", tone: "bg-purple-50 text-purple-800 border-purple-300" };
  }
  if (text.includes("cqc") || text.includes("care quality") || text.includes("health and social care")) {
    return { code: "CQC", label: "Care Quality Commission", tone: "bg-teal-50 text-teal-800 border-teal-300" };
  }
  if (text.includes("hse") || text.includes("health & safety") || text.includes("coshh") || text.includes("puwer") || text.includes("loler") || text.includes("asbestos") || text.includes("cdm")) {
    return { code: "HSE", label: "Health & Safety Executive", tone: "bg-cyan-50 text-cyan-800 border-cyan-300" };
  }
  if (text.includes("environment") || text.includes("waste") || text.includes("epa") || text.includes("drainage")) {
    return { code: "ENV AGENCY", label: "Environment Agency", tone: "bg-lime-50 text-lime-800 border-lime-300" };
  }
  return { code: "STATUTORY", label: "UK Statutory Authority", tone: "bg-slate-100 text-slate-800 border-slate-300" };
}

export function deriveComplianceAction(title: string, evidence: string, category: string, status: string): string {
  if (status === "ok" || status === "on_track") {
    return "Verified compliant — inspection records active";
  }
  const text = `${title} ${evidence} ${category}`.toLowerCase();
  if (text.includes("gas")) {
    return "Commission annual Gas Safe inspection & file CP12 certificate";
  }
  if (text.includes("fire")) {
    return "Complete Fire Risk Assessment (FRA), test exit routes & log fire drill";
  }
  if (text.includes("food") || text.includes("haccp")) {
    return "Maintain documented HACCP controls, daily fridge logs & allergen matrix";
  }
  if (text.includes("licence") || text.includes("alcohol") || text.includes("dps")) {
    return "Verify DPS personal licence, premises operating conditions & Challenge 25 refusals";
  }
  if (text.includes("ico") || text.includes("data protection") || text.includes("gdpr")) {
    return "Pay annual ICO data registration fee & complete CCTV privacy assessment";
  }
  if (text.includes("insurance") || text.includes("employers")) {
    return "Display active £5m+ Employers’ Liability certificate & log staff right-to-work checks";
  }
  if (text.includes("electrical") || text.includes("pat") || text.includes("eicr")) {
    return "Conduct periodic electrical condition inspection (EICR) & PAT test records";
  }
  if (text.includes("water") || text.includes("legionella")) {
    return "Perform Legionella water risk assessment & monthly temperature monitoring";
  }
  if (text.includes("coshh") || text.includes("chemical")) {
    return "Compile hazardous substances (COSHH) inventory & safety data sheets";
  }
  if (text.includes("asbestos")) {
    return "Commission asbestos management survey & compile dutyholder register";
  }
  if (evidence && evidence !== "Documentation on file") {
    return `Obtain & verify proof: ${evidence}`;
  }
  return `Submit compliance questionnaire & retain proof for statutory inspection`;
}

// 16 Canonical prototype obligations for complete statutory fidelity
const CANONICAL_OBLIGATIONS_RAW = [
  {
    id: "OBL-001",
    definitionId: "OBL-001",
    title: "Food hygiene registration",
    category: "food",
    tier: "Sector licensing",
    jurisdiction: "Manchester CC",
    evidence: "Registration certificate",
    cadence: "Annual",
    owner: "A. Mensah",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "2026-11-02",
    basis: "Food Safety Act 1990",
    source: "Food Safety Act 1990",
    why: "You prepare and serve food, so premises must be registered with the local authority.",
  },
  {
    id: "OBL-002",
    definitionId: "OBL-002",
    title: "Premises licence (alcohol)",
    category: "licence",
    tier: "Sector licensing",
    jurisdiction: "Manchester CC",
    evidence: "Premises licence",
    cadence: "On change",
    owner: "A. Mensah",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "—",
    basis: "Licensing Act 2003",
    source: "Licensing Act 2003",
    why: "You sell alcohol, which requires a premises licence from the licensing authority.",
  },
  {
    id: "OBL-003",
    definitionId: "OBL-003",
    title: "Personal licence (DPS)",
    category: "licence",
    tier: "Sector licensing",
    jurisdiction: "Manchester CC",
    evidence: "Personal licence",
    cadence: "On change",
    owner: "R. Okafor",
    status: "due",
    rawStatus: "due_soon",
    nextDue: "2026-10-10",
    basis: "Licensing Act 2003",
    source: "Licensing Act 2003",
    why: "A Designated Premises Supervisor holding a personal licence is required to authorise alcohol sales.",
  },
  {
    id: "OBL-004",
    definitionId: "OBL-004",
    title: "Late-night refreshment authorisation",
    category: "licence",
    tier: "Sector licensing",
    jurisdiction: "Manchester CC",
    evidence: "Licence variation",
    cadence: "On change",
    owner: "A. Mensah",
    status: "na",
    rawStatus: "exempt",
    nextDue: "—",
    basis: "Licensing Act 2003 Sch.2",
    source: "Licensing Act 2003 Sch.2",
    why: "Serving hot food/drink after 23:00 triggers this — currently not applicable to your stated hours.",
  },
  {
    id: "OBL-005",
    definitionId: "OBL-005",
    title: "Fire risk assessment",
    category: "fire",
    tier: "Universal",
    jurisdiction: "England",
    evidence: "Written FRA",
    cadence: "Annual / on change",
    owner: "J. Fields",
    status: "overdue",
    rawStatus: "overdue",
    nextDue: "2026-09-01",
    basis: "Regulatory Reform (Fire Safety) Order 2005",
    source: "Regulatory Reform (Fire Safety) Order 2005",
    why: "As an employer occupying premises, you must maintain a current fire risk assessment.",
  },
  {
    id: "OBL-006",
    definitionId: "OBL-006",
    title: "Gas safety inspection",
    category: "hs",
    tier: "Universal",
    jurisdiction: "England",
    evidence: "CP12 certificate",
    cadence: "Annual",
    owner: "J. Fields",
    status: "due",
    rawStatus: "due_soon",
    nextDue: "2026-10-05",
    basis: "Gas Safety (Installation & Use) Regs 1998",
    source: "Gas Safety (Installation & Use) Regs 1998",
    why: "You operate commercial gas appliances, which need annual inspection by a Gas Safe engineer.",
  },
  {
    id: "OBL-007",
    definitionId: "OBL-007",
    title: "Electrical installation condition report",
    category: "hs",
    tier: "Universal",
    jurisdiction: "England",
    evidence: "EICR",
    cadence: "5-yearly",
    owner: "J. Fields",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "2029-03-14",
    basis: "Electricity at Work Regs 1989",
    source: "Electricity at Work Regs 1989",
    why: "Fixed electrical installations must be periodically inspected and tested.",
  },
  {
    id: "OBL-008",
    definitionId: "OBL-008",
    title: "Employers’ liability insurance",
    category: "employ",
    tier: "Universal",
    jurisdiction: "England",
    evidence: "Certificate of insurance",
    cadence: "Annual",
    owner: "A. Mensah",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "2027-01-20",
    basis: "Employers’ Liability (Compulsory Insurance) Act 1969",
    source: "Employers’ Liability (Compulsory Insurance) Act 1969",
    why: "You employ staff, so you must hold at least £5m employers’ liability cover and display the certificate.",
  },
  {
    id: "OBL-009",
    definitionId: "OBL-009",
    title: "Allergen information controls",
    category: "food",
    tier: "Sector licensing",
    jurisdiction: "England",
    evidence: "Allergen matrix + SOP",
    cadence: "On menu change",
    owner: "R. Okafor",
    status: "due",
    rawStatus: "due_soon",
    nextDue: "2026-10-01",
    basis: "Food Information Regs 2014 (Natasha’s Law)",
    source: "Food Information Regs 2014 (Natasha’s Law)",
    why: "You provide food to consumers, so allergen information must be accurate and available.",
  },
  {
    id: "OBL-010",
    definitionId: "OBL-010",
    title: "HACCP food safety management",
    category: "food",
    tier: "Sector licensing",
    jurisdiction: "England",
    evidence: "HACCP plan + records",
    cadence: "Ongoing",
    owner: "R. Okafor",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "—",
    basis: "Regulation (EC) 852/2004",
    source: "Regulation (EC) 852/2004",
    why: "Food businesses must operate a documented food safety management system based on HACCP principles.",
  },
  {
    id: "OBL-011",
    definitionId: "OBL-011",
    title: "ICO data protection registration",
    category: "data",
    tier: "Data & cyber",
    jurisdiction: "UK",
    evidence: "ICO registration",
    cadence: "Annual",
    owner: "O. Balogun",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "2027-02-11",
    basis: "Data Protection Act 2018",
    source: "Data Protection Act 2018",
    why: "You process personal data (staff, CCTV, bookings), so you must pay the ICO data protection fee.",
  },
  {
    id: "OBL-012",
    definitionId: "OBL-012",
    title: "PCI DSS SAQ (card payments)",
    category: "data",
    tier: "Data & cyber",
    jurisdiction: "UK",
    evidence: "Self-assessment questionnaire",
    cadence: "Annual",
    owner: "O. Balogun",
    status: "due",
    rawStatus: "due_soon",
    nextDue: "2026-10-18",
    basis: "PCI DSS v4.0",
    source: "PCI DSS v4.0",
    why: "You accept card payments, so your card-handling environment must be self-assessed annually.",
  },
  {
    id: "OBL-013",
    definitionId: "OBL-013",
    title: "CCTV / privacy notice & DPIA",
    category: "data",
    tier: "Data & cyber",
    jurisdiction: "UK",
    evidence: "DPIA + signage",
    cadence: "On change",
    owner: "O. Balogun",
    status: "overdue",
    rawStatus: "overdue",
    nextDue: "2026-08-20",
    basis: "UK GDPR Art.35",
    source: "UK GDPR Art.35",
    why: "Operating CCTV that monitors staff/customers requires a data protection impact assessment.",
  },
  {
    id: "OBL-014",
    definitionId: "OBL-014",
    title: "Right to work checks",
    category: "employ",
    tier: "Employment",
    jurisdiction: "UK",
    evidence: "Check records per employee",
    cadence: "Per hire",
    owner: "A. Mensah",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "—",
    basis: "Immigration, Asylum & Nationality Act 2006",
    source: "Immigration, Asylum & Nationality Act 2006",
    why: "You employ staff, so you must verify and record each employee’s right to work.",
  },
  {
    id: "OBL-015",
    definitionId: "OBL-015",
    title: "Working time & rest-break records",
    category: "employ",
    tier: "Employment",
    jurisdiction: "UK",
    evidence: "Rota + records",
    cadence: "Ongoing",
    owner: "A. Mensah",
    status: "due",
    rawStatus: "due_soon",
    nextDue: "2026-10-08",
    basis: "Working Time Regulations 1998",
    source: "Working Time Regulations 1998",
    why: "You must record hours and ensure statutory rest breaks for workers.",
  },
  {
    id: "OBL-016",
    definitionId: "OBL-016",
    title: "Health & safety policy (written)",
    category: "employ",
    tier: "Employment",
    jurisdiction: "GB",
    evidence: "Written H&S policy",
    cadence: "On change",
    owner: "J. Fields",
    status: "ok",
    rawStatus: "on_track",
    nextDue: "—",
    basis: "Health & Safety at Work etc. Act 1974",
    source: "Health & Safety at Work etc. Act 1974",
    why: "With 5+ employees you must have a written health and safety policy.",
  },
];
 
const CANONICAL_OBLIGATIONS: UnifiedObligation[] = CANONICAL_OBLIGATIONS_RAW.map((o) => ({
  ...o,
  tier: o.tier as UnifiedObligation["tier"],
  status: o.status as UnifiedObligation["status"],
  actionRequired: deriveComplianceAction(o.title, o.evidence, o.category, o.status as "ok" | "due" | "overdue" | "na"),
  regulatoryAuthority: deriveRegulatoryAuthority(o.title, o.basis, o.category).code,
}));

const DEFAULT_LOGS: LogEntry[] = [
  {
    id: "LOG-2041",
    type: "Fire incident",
    category: "fire",
    description: "Small pan flare in kitchen, extinguished with fire blanket. No injuries. Extraction checked.",
    createdByName: "J. Fields",
    createdAt: "2026-09-18T10:30:00Z",
    site: { id: "s2", name: "Deansgate kitchen" },
    obligation: { id: "OBL-005", title: "Fire risk assessment", definitionId: "OBL-005" },
    evidence: [],
  },
  {
    id: "LOG-2040",
    type: "Challenge 25 refusal",
    category: "licence",
    description: "Refused alcohol sale, ID declined. Logged per licensing conditions.",
    createdByName: "R. Okafor",
    createdAt: "2026-09-16T21:15:00Z",
    site: { id: "s1", name: "Northern Quarter café" },
    obligation: { id: "OBL-002", title: "Premises licence (alcohol)", definitionId: "OBL-002" },
    evidence: [],
  },
  {
    id: "LOG-2039",
    type: "Inspection",
    category: "food",
    description: "Weekly internal food safety walk-through completed, 2 minor actions raised.",
    createdByName: "A. Mensah",
    createdAt: "2026-09-12T09:00:00Z",
    site: { id: "s2", name: "Deansgate kitchen" },
    obligation: { id: "OBL-010", title: "HACCP food safety management", definitionId: "OBL-010" },
    evidence: [],
  },
  {
    id: "LOG-2038",
    type: "Electrical inspection",
    category: "hs",
    description: "PAT testing of portable appliances completed, all passed.",
    createdByName: "External (Volt Ltd)",
    createdAt: "2026-09-05T14:20:00Z",
    site: { id: "s1", name: "Northern Quarter café" },
    obligation: { id: "OBL-007", title: "Electrical installation condition report", definitionId: "OBL-007" },
    evidence: [],
  },
  {
    id: "LOG-2037",
    type: "Near-miss",
    category: "hs",
    description: "Wet floor, no warning signage placed. Corrected immediately and staff reminded.",
    createdByName: "J. Fields",
    createdAt: "2026-08-22T11:45:00Z",
    site: { id: "s2", name: "Deansgate kitchen" },
    obligation: { id: "OBL-016", title: "Health & safety policy (written)", definitionId: "OBL-016" },
    evidence: [],
  },
];

export function Dashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [obligations, setObligations] = useState<UnifiedObligation[]>(CANONICAL_OBLIGATIONS);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);
  const [error, setError] = useState<string | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);

  // Selected obligation for Detail Modal
  const [selectedObligation, setSelectedObligation] = useState<UnifiedObligation | null>(null);

  // Register filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "due" | "overdue" | "na" | "attention">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [evaluating, setEvaluating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["OBL-003", "OBL-005"]));

  useEffect(() => {
    Promise.all([
      client.me().catch(() => null),
      client.organisation().catch(() => null),
      client.listObligations().catch(() => []),
      client.listLogs().catch(() => []),
    ])
      .then(([meRes, orgRes, liveObls, liveLogs]) => {
        if (meRes?.user) setUser(meRes.user);
        if (orgRes) setOrg(orgRes);

        if (Array.isArray(liveObls) && liveObls.length > 0) {
          // Map real live obligations from database
          const mapped: UnifiedObligation[] = liveObls.map((o: Obligation, idx: number) => {
            const canonicalMatch = CANONICAL_OBLIGATIONS.find(
              (c) => c.definitionId === o.definitionId || c.title.toLowerCase() === o.title.toLowerCase(),
            );

            const isOk = o.status === "on_track" || o.status === "ok";
            const isOverdue = o.status === "overdue";
            const isExempt = o.status === "exempt" || o.status === "na";
            const status: UnifiedObligation["status"] = isOk ? "ok" : isOverdue ? "overdue" : isExempt ? "na" : "due";

            const tier: UnifiedObligation["tier"] =
              o.category === "employment" || o.category === "employ"
                ? "Employment"
                : o.category === "data_cyber" || o.category === "data"
                ? "Data & cyber"
                : o.category === "licensing" ||
                  o.category === "licence" ||
                  o.category === "sector_licensing" ||
                  o.category === "food" ||
                  o.category === "care" ||
                  o.category === "construction" ||
                  o.category === "property"
                ? "Sector licensing"
                : canonicalMatch?.tier || "Universal";

            const auth = deriveRegulatoryAuthority(o.title, o.basis || "", o.category || "");
            const actionRequired = deriveComplianceAction(o.title, o.evidence || "", o.category || "", status);

            return {
              id: o.definitionId || `OBL-${String(idx + 1).padStart(3, "0")}`,
              definitionId: o.definitionId || `OBL-${String(idx + 1).padStart(3, "0")}`,
              title: o.title,
              category: o.category || "universal",
              tier,
              jurisdiction: orgRes?.council || orgRes?.jurisdiction || canonicalMatch?.jurisdiction || "Local Authority (UK)",
              evidence: o.evidence || canonicalMatch?.evidence || "Statutory certificate or inspection log",
              cadence: o.cadence || canonicalMatch?.cadence || "Annual",
              owner: o.ownerRole || canonicalMatch?.owner || "Designated Lead / Duty Manager",
              status,
              rawStatus: o.status,
              nextDue: o.nextDueAt
                ? new Date(o.nextDueAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
                : canonicalMatch?.nextDue || (o.cadence === "Annual" ? "2027-01-15" : "Ongoing"),
              basis: o.basis || canonicalMatch?.basis || "UK Statutory Regulation",
              source: (o as { source?: string }).source || auth.label,
              why: o.aiWhy || canonicalMatch?.why || "Mandatory compliance obligation for your operational profile.",
              actionRequired,
              regulatoryAuthority: auth.code,
              formProgress: o.formProgress || null,
            };
          });

          setObligations(mapped);
        } else {
          setObligations(CANONICAL_OBLIGATIONS);
        }

        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          setLogs(liveLogs);
        }
      })
      .catch(() => setError("Could not load your compliance dashboard."));
  }, []);

  // Readiness Metrics
  const applicable = obligations.filter((o) => o.status !== "na").length || 1;
  const okCount = obligations.filter((o) => o.status === "ok").length;
  const dueCount = obligations.filter((o) => o.status === "due").length;
  const overdueCount = obligations.filter((o) => o.status === "overdue").length;
  const naCount = obligations.filter((o) => o.status === "na").length;
  const readiness = Math.round((okCount / applicable) * 100);

  // Animated Circular Gauge
  useEffect(() => {
    let current = 0;
    const stepVal = Math.max(1, Math.floor(readiness / 30));
    const timer = setInterval(() => {
      current += stepVal;
      if (current >= readiness) {
        current = readiness;
        clearInterval(timer);
      }
      setAnimatedPct(current);
    }, 16);
    return () => clearInterval(timer);
  }, [readiness]);

  // Circumference for 172x172 circle with radius 76
  const circumference = 477.5;
  const strokeOffset = circumference * (1 - readiness / 100);

  // Dynamic Authority badge
  const renderAuthBadge = (obl: UnifiedObligation) => {
    const auth = deriveRegulatoryAuthority(obl.title, obl.basis || "", obl.category || "");
    return (
      <span className={`font-mono font-bold text-[9.5px] px-1.5 py-0.5 rounded border ${auth.tone}`}>
        {auth.code}
      </span>
    );
  };

  const renderStatusPill = (st: "ok" | "due" | "overdue" | "na") => {
    if (st === "ok") {
      return (
        <span className="pill st-ok">
          <span className="dot" /> VERIFIED MET
        </span>
      );
    }
    if (st === "due") {
      return (
        <span className="pill st-due">
          <span className="dot" /> ACTION NEEDED
        </span>
      );
    }
    if (st === "overdue") {
      return (
        <span className="pill st-bad">
          <span className="dot" /> OVERDUE
        </span>
      );
    }
    return (
      <span className="pill st-na">
        <span className="dot" /> EXEMPT
      </span>
    );
  };

  // Domain breakdown
  const tiers: ("Sector licensing" | "Universal" | "Data & cyber" | "Employment")[] = [
    "Sector licensing",
    "Universal",
    "Data & cyber",
    "Employment",
  ];

  const tierBreakdowns = useMemo(() => {
    return tiers.map((tier) => {
      const items = obligations.filter((o) => o.tier === tier && o.status !== "na");
      const met = items.filter((o) => o.status === "ok").length;
      const pct = items.length ? Math.round((met / items.length) * 100) : 100;
      return { tier, items, met, total: items.length, pct };
    });
  }, [obligations]);

  // Filtered obligations for the embedded register
  const filteredObligations = useMemo(() => {
    return obligations.filter((o) => {
      if (statusFilter === "attention") {
        if (o.status !== "due" && o.status !== "overdue") return false;
      } else if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }
      if (tierFilter !== "all" && o.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.title.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.basis.toLowerCase().includes(q) ||
          o.owner.toLowerCase().includes(q) ||
          o.jurisdiction.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [obligations, statusFilter, tierFilter, searchQuery]);

  const reevaluateObligations = async () => {
    setEvaluating(true);
    try {
      await client.generateObligations();
      const updated = await client.listObligations();
      if (Array.isArray(updated) && updated.length > 0) {
        setObligations((prev) =>
          prev.map((p) => {
            const match = updated.find((u) => u.definitionId === p.definitionId || u.title === p.title);
            if (!match) return p;
            return {
              ...p,
              status: match.status === "on_track" || match.status === "ok" ? "ok" : match.status === "overdue" ? "overdue" : "due",
            };
          }),
        );
      }
    } catch {
      // Fallback
    } finally {
      setEvaluating(false);
    }
  };

  // Upcoming deadlines (first 5 sorted by nextDue)
  const upcomingDeadlines = useMemo(() => {
    return obligations
      .filter((o) => o.nextDue && o.nextDue !== "—")
      .slice(0, 5);
  }, [obligations]);

  // Recommendations dynamically derived from obligations requiring action
  const recommendations = useMemo(() => {
    const actionDuties = obligations.filter((o) => o.status === "due" || o.status === "overdue");
    const list = actionDuties.length > 0 ? actionDuties : obligations;
    return list.slice(0, 6).map((o) => {
      const isHigh =
        o.status === "overdue" ||
        o.title.toLowerCase().includes("fire") ||
        o.title.toLowerCase().includes("gas") ||
        o.title.toLowerCase().includes("licen");
      const isMed =
        o.status === "due" ||
        o.title.toLowerCase().includes("food") ||
        o.title.toLowerCase().includes("ico");
      const risk: "high" | "med" | "low" = isHigh ? "high" : isMed ? "med" : "low";

      return {
        title: o.actionRequired,
        action: o.evidence,
        obl: `${o.id} · ${o.basis}`,
        risk,
        oblId: o.id,
        obligation: o,
      };
    });
  }, [obligations]);

  const handleExportCsv = () => {
    const headers = ["ID", "Title", "Discipline", "Jurisdiction", "Lead", "Next Due", "Status", "Legal Basis"];
    const rows = filteredObligations.map((o) => [
      `"${o.id}"`,
      `"${o.title.replace(/"/g, '""')}"`,
      `"${o.tier}"`,
      `"${o.jurisdiction}"`,
      `"${o.owner}"`,
      `"${o.nextDue}"`,
      `"${o.status.toUpperCase()}"`,
      `"${o.basis.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ballast-obligations-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkReviewed = (obl: UnifiedObligation) => {
    setObligations((prev) =>
      prev.map((item) => (item.id === obl.id ? { ...item, status: "ok" } : item)),
    );
    setSelectedObligation((prev) => (prev ? { ...prev, status: "ok" } : null));
    client.confirmObligation(obl.id).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Executive Header matching reference mockup */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {/* Line chart icon next to title from mockup */}
            <div className="text-slate-800">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Statutory Revenue &amp; Duties
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="font-semibold text-slate-800">{org?.name || "Acme Inc."}</span>
            <span className="text-slate-300">/</span>
            <span>{sectorLabel(org?.sector || "hospitality")}</span>
            {org?.council && (
              <>
                <span className="text-slate-300">/</span>
                <span>{org.council}</span>
              </>
            )}
            <span className="text-slate-300">/</span>
            <span>{org?.sites?.length || 1} premises</span>
            <span className="text-slate-300">/</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Continuous Audit Active
            </span>
          </div>
        </div>

        {/* Pill Filter Buttons & Actions from mockup */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="filter-pill">
            <span>📅</span>
            <span>Last 30 days</span>
            <span className="text-slate-400 text-[10px]">⌃</span>
          </button>
          <button type="button" className="filter-pill">
            <span>👤</span>
            <span>Consultant / Lead</span>
            <span className="text-slate-400 text-[10px]">⌃</span>
          </button>
          <button
            type="button"
            onClick={reevaluateObligations}
            disabled={evaluating}
            className="filter-pill"
          >
            <span className={evaluating ? "animate-spin" : ""}>🔄</span>
            <span>{evaluating ? "Syncing..." : "Re-evaluate"}</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickLogOpen(true)}
            className="btn btn-sunset btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Readiness */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Statutory Readiness</span>
            <span className="pill st-ok !text-[10px] !py-0.5 font-mono">HEALTHY</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {animatedPct}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Overall statutory posture
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${animatedPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Verified Duties */}
        <button
          type="button"
          onClick={() => setStatusFilter("ok")}
          className={`card p-4 flex flex-col justify-between text-left transition ${
            statusFilter === "ok" ? "ring-2 ring-emerald-500" : "hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Verified Met</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {okCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Obligations compliant
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {Math.round((okCount / (obligations.length || 1)) * 100)}% of total requirements
          </div>
        </button>

        {/* Metric 3: Due Soon */}
        <button
          type="button"
          onClick={() => setStatusFilter("due")}
          className={`card p-4 flex flex-col justify-between text-left transition ${
            statusFilter === "due" ? "ring-2 ring-amber-500" : "hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Due Soon (&lt;30d)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-amber-700 font-mono tracking-tight">
              {dueCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Requires scheduled review
            </div>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Next due in 12 days
          </div>
        </button>

        {/* Metric 4: Action Required / Overdue */}
        <button
          type="button"
          onClick={() => setStatusFilter("attention")}
          className={`card p-4 flex flex-col justify-between text-left transition ${
            statusFilter === "attention" || statusFilter === "overdue"
              ? "ring-2 ring-rose-500"
              : "hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Action Required</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-rose-700 font-mono tracking-tight">
              {overdueCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Statutory breaches / overdue
            </div>
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            {overdueCount > 0 ? "Immediate attention required" : "Zero active breaches"}
          </div>
        </button>
      </div>

      {/* Executive Compliance Action Plan: Variant of the sidebar sunset texture card */}
      <div className="sunset-dashboard-banner p-5 sm:p-6 space-y-4 shadow-xl relative">
        <div className="sunset-glow-accent absolute inset-0 pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Blue Squircle Sparkle Brand Icon directly matching brand identity */}
            <div className="relative grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#0284C7] shadow-xs">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#FFFFFF">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Compliance Action Plan: What {org?.name || "your business"} needs to do</span>
                  <span className="nav-red-dot" title="Live priority actions" />
                </h2>
                <span className="sunset-pill font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  {dueCount + overdueCount} Actions Queued
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Statutory duties synthesized from your operational premises, machinery, and local council regulations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/obligations"
              className="btn btn-ghost btn-sm text-xs !bg-[#27272A] !text-white !border-white/10 hover:!bg-[#3F3F46] flex items-center gap-1.5 transition"
            >
              <span>Full compliance register</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Priority Action Cards with Sunset Accent Hairlines */}
        <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-white/10 bg-[#27272A]/90 hover:bg-[#27272A] hover:border-white/20 transition text-left flex flex-col justify-between shadow-xs space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`pill !py-0.5 font-mono text-[9px] ${
                      rec.risk === "high"
                        ? "st-bad"
                        : rec.risk === "med"
                        ? "st-due"
                        : "st-ok"
                    }`}
                  >
                    {rec.risk === "high" ? "PRIORITY ACTION" : rec.risk === "med" ? "STATUTORY DUTY" : "MAINTAIN"}
                  </span>
                  {rec.obligation && renderAuthBadge(rec.obligation)}
                </div>
                <div className="font-semibold text-white text-xs sm:text-sm leading-snug">
                  {rec.title}
                </div>
                <div className="text-[11px] text-[#A1A1AA] font-mono line-clamp-2">
                  {rec.obligation?.why || rec.obl}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="text-[10.5px] font-mono text-slate-400">
                  Proof: <span className="text-slate-300 font-medium truncate inline-block max-w-[120px]" title={rec.action}>{rec.action}</span>
                </div>
                <button
                  type="button"
                  onClick={() => rec.obligation && setSelectedObligation(rec.obligation)}
                  className="btn-sunset-sm cursor-pointer shadow-xs"
                >
                  <span>Resolve</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Statutory Obligations Register (8 cols) */}
        <div id="obligations-register" className="lg:col-span-8 space-y-4">
          <div className="card p-4 space-y-3">
            {/* Header + Tabs + Search & Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    statusFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  All Duties ({obligations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("attention")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    statusFilter === "attention"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>Action Needed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusFilter === "attention" ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"
                  }`}>
                    {dueCount + overdueCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ok")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    statusFilter === "ok"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Verified ({okCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn btn-ghost btn-sm !py-1 text-slate-600 text-xs flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter toolbar: Live Search + Area select */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field !pl-9 !py-1.5 !text-xs bg-slate-50 focus:bg-white"
                  placeholder="Filter by duty, statutory ID (e.g. OBL-001), or regulator..."
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: "All Areas" },
                  { id: "Sector licensing", label: "Licensing" },
                  { id: "Universal", label: "Universal" },
                  { id: "Employment", label: "Employment" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTierFilter(t.id)}
                    className={`btn-chip !py-1 !text-xs ${tierFilter === t.id ? "active" : ""}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Utilization & Telemetry Barcode Activity Card (from reference mockup) */}
          <div className="card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 border-b border-dotted border-slate-400 pb-0.5">
                Resource Utilization
              </span>
              <span className="font-mono text-[11px] text-slate-400">Continuous telemetry feed</span>
            </div>
            {/* Fine vertical barcode histogram with grey, amber, and red accents */}
            <div className="barcode-histogram" title="Live statutory check activity">
              {[
                12, 18, 14, 22, 16, 28, 20, 15, 34, 18, 24, 16, 20, 38, 22, 14, 26, 18, 30, 24,
                16, 32, 20, 18, 26, 34, 22, 16, 28, 20, 36, 18, 24, 16, 30, 22, 18, 26, 34, 20,
                16, 28, 22, 38, 18, 24, 16, 32, 20, 26, 18, 34, 22, 16, 28, 20, 36, 18, 24, 38
              ].map((height, idx) => {
                const isCrimson = idx === 8 || idx === 58 || idx === 59;
                const isAmber = idx === 3 || idx === 13 || idx === 25 || idx === 43;
                return (
                  <div
                    key={idx}
                    className={`barcode-bar ${isCrimson ? "crimson !h-[36px]" : isAmber ? "amber !h-[28px]" : ""}`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Clean Obligations Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dtable w-full">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIds((prev) => {
                            if (prev.size === filteredObligations.length) return new Set();
                            return new Set(filteredObligations.map((o) => o.id));
                          });
                        }}
                        className="grid h-4 w-4 place-items-center rounded border border-slate-300 bg-white hover:border-slate-400"
                        title="Toggle selection"
                      >
                        {selectedIds.size > 0 ? (
                          <span className="block h-2 w-2 rounded-xs bg-slate-900" />
                        ) : null}
                      </button>
                    </th>
                    <th>- Duty ID</th>
                    <th className="w-1/3">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                        </svg>
                        <span>Obligation &amp; Regulator</span>
                      </div>
                    </th>
                    <th className="w-1/3">Required Action &amp; Evidence</th>
                    <th>Area</th>
                    <th>Accountable</th>
                    <th>Next Due</th>
                    <th className="text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObligations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        No obligations match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredObligations.map((o) => {
                      const isSelected = selectedIds.has(o.id);
                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedObligation(o)}
                          className={`clickable hover:bg-slate-50/80 transition-colors ${
                            isSelected ? "hazard-stripe-left bg-amber-50/20" : ""
                          }`}
                        >
                          <td
                            className="text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(o.id)) next.delete(o.id);
                                else next.add(o.id);
                                return next;
                              });
                            }}
                          >
                            <div className="grid h-4 w-4 place-items-center rounded border border-slate-300 bg-white hover:border-slate-500 cursor-pointer">
                              {isSelected ? (
                                <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-900" fill="none" stroke="currentColor" strokeWidth="3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-semibold text-slate-800">{o.id}</span>
                          </td>
                          <td>
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {o.title}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              {renderAuthBadge(o)}
                              <span className="text-slate-400 truncate max-w-[180px]" title={o.basis}>
                                {o.basis}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="text-xs font-medium text-slate-800 leading-snug">
                              {o.actionRequired}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[220px]" title={o.evidence}>
                              Proof: <span className="text-slate-600 font-medium">{o.evidence}</span>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-slate-600">{o.tier}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-700 font-medium">{o.owner}</span>
                          </td>
                          <td>
                            <div className="font-mono text-xs font-semibold text-slate-800">{o.nextDue}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{o.cadence}</div>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {renderStatusPill(o.status)}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedObligation(o);
                                }}
                                className="btn-sunset-sm cursor-pointer shadow-xs"
                                title="View exact compliance steps"
                              >
                                <span>Action</span>
                                <span>&rarr;</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence & Action Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upcoming Deadlines */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Upcoming Deadlines
                </h3>
              </div>
              <Link href="/app/monitoring" className="text-[11px] text-sky-600 hover:text-sky-800 font-medium">
                View all &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedObligation(o)}
                  className="w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate">{o.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{o.id}</span>
                      <span>·</span>
                      {renderAuthBadge(o)}
                    </div>
                  </div>
                  <div className="text-right flex-none">
                    <div className="text-xs font-mono font-bold text-slate-700">{o.nextDue}</div>
                    <div className="mt-1">{renderStatusPill(o.status)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Action Items */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Recommended Actions
                </h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{recommendations.length} queued</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recommendations.slice(0, 3).map((r, i) => {
                const matched = obligations.find((o) => o.id === r.oblId);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (matched) setSelectedObligation(matched);
                    }}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                  >
                    <span className="mt-0.5 flex-none">
                      {r.risk === "high" ? (
                        <span className="pill st-bad !py-0.5 font-mono text-[9.5px]">HIGH</span>
                      ) : r.risk === "med" ? (
                        <span className="pill st-due !py-0.5 font-mono text-[9.5px]">MED</span>
                      ) : (
                        <span className="pill st-info !py-0.5 font-mono text-[9.5px]">INFO</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 leading-snug">{r.title}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{r.obl}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Audit Ledger */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Audit Activity
                </h3>
              </div>
              <Link href="/app/logbook" className="text-[11px] text-sky-600 hover:text-sky-800 font-medium">
                Logbook &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {logs.slice(0, 4).map((l) => (
                <div key={l.id} className="p-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pill st-info !py-0.5 font-mono text-[10px]">{l.type}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1 truncate font-medium">
                    {l.description || l.type}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    {l.site.name} · {l.createdByName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OBLIGATION DETAIL MODAL (PROTOTYPE FIDELITY)                                */}
      {/* ========================================================================= */}
      {selectedObligation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedObligation(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 relative border hairline"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedObligation(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 hover:text-slate-800 transition"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6 pr-8">
              <div className="flex items-center gap-2 mb-2 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                  {selectedObligation.tier}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-bold">{selectedObligation.id}</span>
                <span>·</span>
                {renderAuthBadge(selectedObligation)}
              </div>
              <h2 className="font-display text-2xl font-bold text-ink leading-snug">
                {selectedObligation.title}
              </h2>
              <div className="mt-2.5 flex items-center gap-3">
                {renderStatusPill(selectedObligation.status)}
                <span className="text-xs text-slate-400 font-mono">
                  Cadence: {selectedObligation.cadence}
                </span>
              </div>
            </div>

            {/* Interactive Action Bar with Form and Vault Links */}
            <div className="flex flex-wrap gap-2.5 mb-6 pb-5 border-b hairline">
              <Link
                href={`/app/obligations/${selectedObligation.id}`}
                className="btn btn-sunset btn-sm flex items-center gap-1.5 font-semibold text-white shadow-sm"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>
                  {selectedObligation.formProgress
                    ? `Fill Form (${selectedObligation.formProgress.percent}% complete)`
                    : "Complete Compliance Form"}
                </span>
              </Link>
              <Link
                href="/app/vault"
                className="btn btn-ghost btn-sm flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 font-medium"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload Certificate / Proof</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedObligation(null);
                  setQuickLogOpen(true);
                }}
                className="btn btn-ghost btn-sm flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 font-medium"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Log Check / Incident</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkReviewed(selectedObligation)}
                className="btn btn-ghost btn-sm flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 font-medium"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Mark as Verified Met</span>
              </button>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* What you need to do for compliance */}
              <div className="card p-5 bg-gradient-to-br from-rose-50/50 via-white to-white border-l-4 border-l-[#E52E2E]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#E52E2E] font-mono flex items-center gap-1.5">
                    <span>⚡ Action required for statutory compliance</span>
                  </div>
                  {renderAuthBadge(selectedObligation)}
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1 leading-snug">
                  {selectedObligation.actionRequired}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Required Proof: <span className="font-semibold text-slate-800">{selectedObligation.evidence}</span>
                </p>
              </div>

              {/* Why this applies to your premises */}
              <div className="card p-5 bg-slate-50/50">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                  Why this applies to your business
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedObligation.why}
                </p>
                <div className="mt-3.5 pt-3 border-t hairline flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Statutory basis:</span>
                  <span className="font-semibold text-slate-700">{selectedObligation.basis}</span>
                </div>
              </div>

              {/* Details List */}
              <div className="card p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
                  Statutory Metadata &amp; Ownership
                </div>
                <dl className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border hairline">
                    <dt className="text-slate-400 mb-0.5">Jurisdiction</dt>
                    <dd className="font-semibold text-slate-800">{selectedObligation.jurisdiction}</dd>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border hairline">
                    <dt className="text-slate-400 mb-0.5">Evidence Requirement</dt>
                    <dd className="font-semibold text-slate-800">{selectedObligation.evidence}</dd>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border hairline">
                    <dt className="text-slate-400 mb-0.5">Filing Cadence</dt>
                    <dd className="font-semibold text-slate-800">{selectedObligation.cadence}</dd>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border hairline">
                    <dt className="text-slate-400 mb-0.5">Accountable Lead</dt>
                    <dd className="font-semibold text-slate-800">{selectedObligation.owner}</dd>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border hairline sm:col-span-2 flex items-center justify-between">
                    <div>
                      <dt className="text-slate-400 mb-0.5">Next Audit / Renewal Due</dt>
                      <dd className="font-mono font-bold text-slate-900 text-sm">{selectedObligation.nextDue}</dd>
                    </div>
                    {renderStatusPill(selectedObligation.status)}
                  </div>
                </dl>
              </div>

              {/* Linked Evidence Preview */}
              <div className="card p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
                  Linked Evidence &amp; Compliance Proof
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border hairline">
                  <span className="w-8 h-8 rounded bg-white border hairline grid place-items-center text-slate-500">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-ink truncate">
                      {selectedObligation.evidence}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Current status: {selectedObligation.status === "ok" ? "Verified Met" : "Action Required"}
                    </div>
                  </div>
                  {renderStatusPill(selectedObligation.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      <QuickLogModal
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSaved={() => {
          client.listLogs().then((l) => setLogs(l));
        }}
      />
    </div>
  );
}
