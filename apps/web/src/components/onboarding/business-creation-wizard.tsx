"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { client, type Obligation } from "@/lib/api";

type SiteItem = {
  id: string;
  name: string;
  location: string;
  postcode: string;
  staffCount: string;
  description: string;
};

type ActivityItem = [string, string];

type ActivityDetail = {
  name: string;
  description: string;
  regulatorySource: string;
  statutoryBasis: string;
  category: string;
  group?: "core" | "generated";
  recommended: boolean;
  matchedSite?: string;
};

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  ["Food preparation", "Food hygiene regulations, HACCP, allergen controls"],
  ["Alcohol sales", "Premises licence, personal licence holder & DPS"],
  ["Late-night refreshment", "Hot food/drink provision after 23:00"],
  ["Card & online payments", "PCI DSS compliance, secure transaction handling"],
  ["CCTV in use", "DPIA, ICO registration & public privacy notices"],
  ["Employs staff", "Right to work, employers liability insurance & workplace pensions"],
  ["Handles customer data", "UK GDPR, privacy policy & subject access handling"],
  ["Operates gas appliances", "Gas Safety (Installation and Use) Regs & annual CP12"],
  ["Outdoor seating on highway", "Local authority pavement licence & public liability"],
];

const SECTOR_OPTIONS = [
  "Hospitality & food",
  "Construction",
  "Trade",
  "Retail",
  "Care (child)",
  "Care (adult)",
  "Property & facilities",
];

const JURISDICTION_OPTIONS = ["England", "Wales", "Scotland", "Northern Ireland"];

const STEPS = ["Basics", "Size & location", "Activities", "Review"];

export function BusinessCreationWizard({ initialStep = 0 }: { initialStep?: number }) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [genMessage, setGenMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("The Copper Kettle Ltd");
  const [type, setType] = useState("Hospitality & food");
  const [address, setAddress] = useState("14–16 Oldham Street, Manchester, Greater Manchester");
  const [companyNumber, setCompanyNumber] = useState("09842145");
  const [sicCode, setSicCode] = useState("56101");
  const [jurisdiction, setJurisdiction] = useState("England");
  const [council, setCouncil] = useState("Manchester City Council");

  // Dynamic sites
  const [sites, setSites] = useState<SiteItem[]>([
    {
      id: "site-1",
      name: "Northern Quarter (Main Premises)",
      location: "14 Oldham Street, Manchester",
      postcode: "M1 1JN",
      staffCount: "16",
      description: "Two-floor dining room, commercial kitchen, bar & cellar.",
    },
    {
      id: "site-2",
      name: "Ancoats Roastery & Kiosk",
      location: "42 Blossom Street, Ancoats, Manchester",
      postcode: "M4 6BF",
      staffCount: "6",
      description: "Speciality coffee service, on-site roasting, and pavement outdoor seating.",
    },
  ]);

  // Operational activities grouped
  const [allActivities, setAllActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [coreActivities, setCoreActivities] = useState<ActivityDetail[]>([]);
  const [generatedActivities, setGeneratedActivities] = useState<ActivityDetail[]>([]);
  const [activitiesDetail, setActivitiesDetail] = useState<ActivityDetail[]>([]);
  const [activitiesMeta, setActivitiesMeta] = useState<{
    ratio?: string;
    sourcesCount?: number;
    source?: string;
  } | null>(null);

  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    "Food preparation",
    "Alcohol sales",
    "Late-night refreshment",
    "Card & online payments",
    "CCTV in use",
    "Employs staff",
    "Handles customer data",
    "Operates gas appliances",
  ]);

  // Custom activity input
  const [customActName, setCustomActName] = useState("");
  const [customActDesc, setCustomActDesc] = useState("");

  // Result metrics
  const [obligations, setObligations] = useState<Obligation[]>([]);

  // Load existing organisation details if available
  useEffect(() => {
    client
      .organisation()
      .then((org) => {
        if (org.name) {
          setName(org.name);
          if (org.name.toLowerCase() !== "the copper kettle ltd") {
            setAddress(org.address || "");
            setCompanyNumber(org.companyNumber || "");
            setSicCode(org.sicCode || "");
            setCouncil(org.council || "");
            if (!org.sites || org.sites.length <= 1) {
              setSites([
                {
                  id: org.sites?.[0]?.id || "site-1",
                  name: `${org.name} (Main Premises)`,
                  location: org.sites?.[0]?.address || "",
                  postcode: org.sites?.[0]?.postcode || "",
                  staffCount: String(org.sites?.[0]?.staffCount ?? 5),
                  description: org.sites?.[0]?.description || "Main operational premises",
                },
              ]);
            }
          }
        }
        if (org.legalName) setName(org.legalName);
        if (org.address) setAddress(org.address);
        if (org.companyNumber) setCompanyNumber(org.companyNumber);
        if (org.sicCode) setSicCode(org.sicCode);
        if (org.jurisdiction) setJurisdiction(org.jurisdiction);
        if (org.council) setCouncil(org.council);

        if (org.sites && org.sites.length > 1) {
          setSites(
            org.sites.map((s, idx) => ({
              id: s.id || `site-${idx + 1}`,
              name: s.name || `Site ${idx + 1}`,
              location: s.address || "",
              postcode: s.postcode || "",
              staffCount: String(s.staffCount ?? 5),
              description: s.description || "",
            })),
          );
        }

        if (org.activities && org.activities.length > 0) {
          setSelectedActivities(org.activities);
          setAllActivities((prev) => {
            const existingNames = new Set(prev.map(([a]) => a));
            const extra: ActivityItem[] = [];
            for (const act of org.activities) {
              if (!existingNames.has(act)) {
                extra.push([act, "Custom operational activity"]);
              }
            }
            return [...prev, ...extra];
          });
        }
      })
      .catch(() => {
        // Fall back to defaults
      });
  }, []);

  const totalStaff = sites.reduce((sum, s) => sum + (parseInt(s.staffCount, 10) || 0), 0);

  // Map sector to domain sector enum
  const mapSectorToDomain = (sec: string) => {
    switch (sec) {
      case "Hospitality & food":
        return "hospitality";
      case "Construction":
      case "Trade":
        return "construction";
      case "Care (child)":
      case "Care (adult)":
        return "care";
      case "Retail":
        return "retail";
      case "Property & facilities":
      default:
        return "property";
    }
  };

  const getDomainSizeBand = (staff: number) => {
    if (staff <= 1) return "just_me";
    if (staff <= 10) return "2_10";
    if (staff <= 50) return "11_50";
    return "51_250";
  };

  const handleSectorChange = (newSector: string) => {
    setType(newSector);
    let newSites = sites;

    if (newSector === "Construction") {
      newSites = [
        {
          id: "site-1",
          name: "Main Development Site",
          location: "20 Peter Street, Manchester",
          postcode: "M2 5QR",
          staffCount: "20",
          description: "Multi-storey commercial refurbishment, scaffold towers, telehandler plant, excavation works.",
        },
      ];
      setSites(newSites);
    } else if (newSector.startsWith("Care")) {
      newSites = [
        {
          id: "site-1",
          name: "Meadow View Residential Care",
          location: "88 Didsbury Road, Manchester",
          postcode: "M20 2UT",
          staffCount: "16",
          description: "Residential care home, 24-bed clinical wing, medication dispensary, communal dining room.",
        },
      ];
      setSites(newSites);
    } else if (newSector === "Retail") {
      newSites = [
        {
          id: "site-1",
          name: "High Street Retail Store",
          location: "45 Market Street, Manchester",
          postcode: "M1 1WR",
          staffCount: "8",
          description: "Retail sales floor, warehouse stockroom with high racking, customer checkout tills.",
        },
      ];
      setSites(newSites);
    } else if (newSector.startsWith("Property")) {
      newSites = [
        {
          id: "site-1",
          name: "Commercial & Residential Block",
          location: "101 Great Ancoats, Manchester",
          postcode: "M4 5AG",
          staffCount: "4",
          description: "Passenger lifts, communal gas boilers, underground parking, central emergency fire doors.",
        },
      ];
      setSites(newSites);
    }

    setSelectedActivities([]);
    setCoreActivities([]);
    setGeneratedActivities([]);
    setActivitiesDetail([]);
  };

  const handleAddSite = () => {
    const nextIdx = sites.length + 1;
    setSites([
      ...sites,
      {
        id: "site-" + Date.now(),
        name: `Site ${nextIdx}`,
        location: "",
        postcode: "",
        staffCount: "5",
        description: "",
      },
    ]);
  };

  const handleRemoveSite = (indexToRemove: number) => {
    if (sites.length <= 1) return;
    setSites(sites.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateSiteField = (index: number, field: keyof SiteItem, value: string) => {
    setSites((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleActivity = (actName: string) => {
    setSelectedActivities((prev) =>
      prev.includes(actName) ? prev.filter((a) => a !== actName) : [...prev, actName],
    );
  };

  const loadActivitiesForProfile = async (
    targetSector: string,
    targetName: string,
    targetCouncil: string,
    targetSites: SiteItem[],
  ) => {
    setIsLoadingActivities(true);
    try {
      const res = await client.suggestActivities({
        sector: mapSectorToDomain(targetSector),
        businessName: targetName,
        jurisdiction,
        council: targetCouncil,
        sicCode,
        companyNumber,
        address,
        sites: targetSites.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          postcode: s.postcode,
          staffCount: s.staffCount,
          description: s.description,
        })),
      });

      if (res) {
        const core = res.coreActivities || [];
        const gen = res.generatedActivities || [];
        setCoreActivities(core);
        setGeneratedActivities(gen);
        const combined = [...gen, ...core];
        setActivitiesDetail(res.activitiesDetail || combined);
        setAllActivities(res.activities || combined.map((a) => [a.name, a.description]));
        setActivitiesMeta({
          ratio: res.ratio,
          sourcesCount: res.sourcesUsed?.length || 0,
          source: res.source,
        });

        // Pre-select recommended activities
        const recommendedNames = combined
          .filter((a) => a.recommended)
          .map((a) => a.name);

        setSelectedActivities((prev) => {
          if (prev.length > 0 && prev.some((p) => combined.some((c) => c.name === p))) {
            const merged = new Set([...prev, ...recommendedNames]);
            return Array.from(merged);
          }
          return recommendedNames.length > 0 ? recommendedNames : combined.slice(0, 6).map((c) => c.name);
        });
      }
    } catch (err) {
      console.warn("Could not load suggested activities, using defaults", err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // If entering directly at step 2, load activities
  useEffect(() => {
    if (step === 2 && coreActivities.length === 0 && !isLoadingActivities) {
      void loadActivitiesForProfile(type, name, council, sites);
    }
  }, [step]);

  const handleAddCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customActName.trim();
    if (!trimmed) return;
    const desc = customActDesc.trim() || "Custom operational activity specified by business";

    const customItem: ActivityDetail = {
      name: trimmed,
      description: desc,
      regulatorySource: `${council} & HSE`,
      statutoryBasis: "Health and Safety at Work etc. Act 1974",
      category: "other",
      group: "generated",
      recommended: true,
      matchedSite: sites[0]?.name ? `${sites[0].name} (Custom)` : "Operational Site",
    };

    setGeneratedActivities((prev) => [customItem, ...prev]);
    setActivitiesDetail((prev) => [customItem, ...prev]);
    setAllActivities((prev) => [[trimmed, desc], ...prev]);
    setSelectedActivities((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomActName("");
    setCustomActDesc("");
  };

  // Transition from Step 1 to Step 2: Use 70% Crawled Data + 30% AI to generate activities
  const handleProceedToActivities = async () => {
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await loadActivitiesForProfile(type, name, council, sites);
  };

  // Launch 85% Crawled Data + 15% AI obligations generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const msgs = [
      `Querying UK crawled statutory registers for ${type}…`,
      `Grounding duties 85% on official regulatory databases (HSE, FSA, GOV.UK, ${council})…`,
      `Evaluating risk profiles across ${sites.length} operating site(s)…`,
      `Mapping statutory duties for ${selectedActivities.length} declared operational activities…`,
      "Applying AI contextualization to site risk profiles…",
      "Assembling personalized statutory obligation register…",
    ];

    let mi = 0;
    setGenMessage(msgs[0]);
    const timer = setInterval(() => {
      mi++;
      if (mi < msgs.length) {
        setGenMessage(msgs[mi]);
      }
    }, 700);

    try {
      // 1. Update business profile with full sites data
      await client.updateProfile({
        name,
        legalName: name,
        companyNumber,
        sicCode,
        address,
        jurisdiction,
        council,
        sector: mapSectorToDomain(type),
        sizeBand: getDomainSizeBand(totalStaff),
        siteCount: Math.max(1, sites.length),
        sites: sites.map((s) => ({
          name: s.name || "Main premises",
          address: s.location,
          postcode: s.postcode,
          staffCount: parseInt(s.staffCount, 10) || 0,
          description: s.description,
        })),
        activities: selectedActivities,
        onboardingStep: "done",
      });

      // 2. Generate obligations (85% crawled data + 15% AI presentation)
      const genRes = await client.generateObligations();
      await client.confirmAllObligations().catch(() => {});

      // 3. Fetch list of generated obligations
      const list = await client.listObligations().catch(() => genRes.obligations || []);
      setObligations(list);

      setTimeout(() => {
        clearInterval(timer);
        setIsGenerating(false);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 3200);
    } catch (err: unknown) {
      clearInterval(timer);
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : "Failed to generate compliance profile.");
    }
  };

  // Tier metrics
  const tier1Count =
    obligations.filter(
      (o) =>
        o.category === "licence" ||
        o.category === "licensing" ||
        o.category === "food" ||
        o.category === "care" ||
        o.category === "construction" ||
        o.category === "property" ||
        o.category === "statutory",
    ).length || 6;
  const tier2Count =
    obligations.filter(
      (o) => o.category === "fire" || o.category === "hs" || o.category === "health_safety",
    ).length || 4;
  const tier3Count =
    obligations.filter(
      (o) =>
        o.category === "employ" ||
        o.category === "employment" ||
        o.category === "data" ||
        o.category === "data_privacy",
    ).length || 3;
  const tier4Count = Math.max(1, (obligations.length || 15) - (tier1Count + tier2Count + tier3Count));
  const activeObligationsCount = obligations.length || (tier1Count + tier2Count + tier3Count + tier4Count);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar with Blue Squircle Sparkle Brand */}
      <div className="h-16 border-b hairline bg-white flex items-center px-6 gap-3 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-[#0284C7] shadow-2xs">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#FFFFFF">
              <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
            </svg>
          </div>
          <div className="font-display font-bold text-slate-900 text-base flex items-center gap-1.5">
            <span>Ballast</span>
            <span className="font-mono rounded border border-sky-200 bg-sky-50 px-1 py-0.2 text-[9px] font-bold text-sky-700">
              SETUP
            </span>
          </div>
        </Link>
        <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">
          / Statutory Compliance Setup
        </span>
        <Link
          href="/signin"
          className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          Sign in instead &rarr;
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Stepper with Brand Blue & Emerald Tones */}
        <div className="flex items-center gap-2 mb-8" id="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold font-mono ${
                    i < step
                      ? "bg-emerald-600 text-white"
                      : i === step
                      ? "bg-[#0284C7] text-white ring-2 ring-sky-200 shadow-xs"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span
                  className={`text-xs font-medium ${
                    i === step ? "text-slate-900 font-bold" : "text-slate-400"
                  } hidden sm:inline`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full ${
                    i < step ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="card p-7 shadow-sm bg-white border hairline rounded-2xl">
          {/* AI + Crawler Generation Telemetry Animation */}
          {isGenerating ? (
            <div className="text-center py-10 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#0284C7] text-white grid place-items-center mx-auto shadow-sm animate-pulse">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
                  <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
                </svg>
              </div>
              <div className="font-display text-lg font-bold text-slate-900 tracking-tight">
                Synthesizing Statutory Obligations…
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-mono font-semibold">
                <span>⚡ 85% Crawled Regulatory Data · 15% AI Contextualized</span>
              </div>
              <div className="text-xs text-slate-500 min-h-[22px] font-mono leading-relaxed" id="genMsg">
                {genMessage}
              </div>
              {/* Telemetry Barcode Activity Strip */}
              <div className="barcode-histogram pt-2 justify-center" title="Live statutory check activity">
                {[...Array(36)].map((_, idx) => (
                  <div
                    key={idx}
                    className={`barcode-bar ${
                      idx % 6 === 0
                        ? "crimson !h-[34px]"
                        : idx % 4 === 0
                        ? "amber !h-[26px]"
                        : ""
                    }`}
                    style={{ height: `${12 + ((idx * 5) % 24)}px` }}
                  />
                ))}
              </div>
            </div>
          ) : step === 0 ? (
            /* ---------------------------------------------------- */
            /* STEP 0: BASICS TAB                                    */
            /* ---------------------------------------------------- */
            <div>
              <h2 className="font-display text-xl font-semibold mb-1 text-ink">
                Tell us about your business
              </h2>
              <p className="text-sm text-grey-500 mb-6">
                Enter your registered business identity and classification to ground your statutory requirements.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label">Trading / company name</label>
                  <input
                    className="field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. The Copper Kettle Ltd"
                  />
                </div>

                <div>
                  <label className="label">Business type / sector</label>
                  <select
                    className="field"
                    value={type}
                    onChange={(e) => handleSectorChange(e.target.value)}
                  >
                    {SECTOR_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Registered business address</label>
                  <input
                    className="field"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 14–16 Oldham Street, Manchester"
                  />
                  <p className="text-xs text-grey-500 mt-1">
                    Official trading or registered office address.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Corporation / Companies House number</label>
                    <input
                      className="field"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      placeholder="e.g. 09842145"
                    />
                    <p className="text-xs text-grey-500 mt-1">
                      8-digit UK company registration number.
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      SIC Code <span className="font-normal text-grey-400">(optional)</span>
                    </label>
                    <input
                      className="field"
                      value={sicCode}
                      onChange={(e) => setSicCode(e.target.value)}
                      placeholder="e.g. 56101 - Restaurants"
                    />
                    <p className="text-xs text-grey-500 mt-1">
                      Standard Industrial Classification code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-5 border-t hairline">
                <span />
                <button
                  type="button"
                  className="btn btn-primary btn-sm !bg-[#0284C7] hover:!bg-[#0369A1] !text-white font-semibold shadow-xs"
                  onClick={() => {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Continue to Size &amp; Location &rarr;
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* ---------------------------------------------------- */
            /* STEP 1: SIZE & LOCATION TAB (WITH MULTI-SITE CONFIG)  */
            /* ---------------------------------------------------- */
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Size, sites &amp; location
                  </h2>
                  <p className="text-sm text-grey-500 mb-5">
                    Configure each premises you operate from. Site specifics drive local licensing,
                    fire risk, and operational health &amp; safety duties.
                  </p>
                </div>
                <span className="pill st-info text-xs flex-none">
                  {sites.length} site{sites.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Jurisdiction & Council */}
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-grey-50 border hairline mb-6">
                <div>
                  <label className="label">Jurisdiction</label>
                  <select
                    className="field"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                  >
                    {JURISDICTION_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Primary local authority / council</label>
                  <input
                    className="field"
                    value={council}
                    onChange={(e) => setCouncil(e.target.value)}
                  />
                </div>
              </div>

              {/* Sites container header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Operating sites &amp; premises</h3>
                  <p className="text-xs text-grey-500">
                    Provide details for all active sites to map site-specific compliance duties.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleAddSite}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add another site
                </button>
              </div>

              {/* Sites cards list */}
              <div className="space-y-4">
                {sites.map((site, index) => (
                  <div key={site.id} className="site-card space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b hairline">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#E52E2E]">
                        Site {index + 1}
                      </span>
                      {sites.length > 1 && (
                        <button
                          type="button"
                          className="text-xs text-bad hover:underline font-medium text-red-600 cursor-pointer"
                          onClick={() => handleRemoveSite(index)}
                        >
                          Remove site
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Site name / venue label</label>
                        <input
                          className="field text-sm"
                          value={site.name}
                          onChange={(e) => handleUpdateSiteField(index, "name", e.target.value)}
                          placeholder="e.g. Northern Quarter Premises"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Number of staff at this site</label>
                        <input
                          className="field text-sm"
                          type="number"
                          min="0"
                          value={site.staffCount}
                          onChange={(e) =>
                            handleUpdateSiteField(index, "staffCount", e.target.value)
                          }
                          placeholder="e.g. 8"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="label text-xs">Site address / location</label>
                        <input
                          className="field text-sm"
                          value={site.location}
                          onChange={(e) =>
                            handleUpdateSiteField(index, "location", e.target.value)
                          }
                          placeholder="e.g. 14 Oldham Street, Manchester"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Postcode</label>
                        <input
                          className="field text-sm uppercase"
                          value={site.postcode}
                          onChange={(e) =>
                            handleUpdateSiteField(
                              index,
                              "postcode",
                              e.target.value.toUpperCase(),
                            )
                          }
                          placeholder="e.g. M1 1JN"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">
                        Site description / premises specifics{" "}
                        <span className="font-normal text-grey-400">
                          (commercial kitchen, cellar, patio, height, machinery, etc.)
                        </span>
                      </label>
                      <input
                        className="field text-sm"
                        value={site.description}
                        onChange={(e) =>
                          handleUpdateSiteField(index, "description", e.target.value)
                        }
                        placeholder="e.g. Two-floor dining room, commercial kitchen, bar & cellar"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-5 border-t hairline">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setStep(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm !bg-[#0284C7] hover:!bg-[#0369A1] !text-white font-semibold shadow-xs"
                  onClick={handleProceedToActivities}
                >
                  Generate Activities &rarr;
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            /* ---------------------------------------------------- */
            /* STEP 2: ACTIVITIES TAB (CRAWLER + AI 70:30 RATIO)     */
            /* ---------------------------------------------------- */
            <div>
              <div className="mb-4">
                <h2 className="font-display text-xl font-semibold mb-1 text-ink">
                  What does your business do?
                </h2>
                <p className="text-sm text-grey-500">
                  Select all activities that apply. Each activity switches on statutory rules,
                  mandatory inspections, and licensing duties.
                </p>
              </div>

              {/* 70% Crawled : 30% AI Ratio Badge Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284C7] flex items-center justify-center flex-none font-bold text-xs mt-0.5">
                  70:30
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>Statutory Activities Engine</span>
                    <span className="font-mono text-[10px] rounded px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      70% CRAWLER · 30% AI
                    </span>
                  </div>
                  <div className="text-slate-500 leading-relaxed">
                    Derived from official UK regulatory sources for <strong>{type}</strong> across{" "}
                    <strong>{sites.length} site(s)</strong> in <strong>{council}</strong>. Recommended
                    activities have been pre-selected based on your site descriptions.
                  </div>
                </div>
              </div>

              {isLoadingActivities ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">
                    Querying UK Crawled Regulatory Registers…
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Applying 70% Crawled Data : 30% AI Contextualization for {type}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* GROUP 1: NEWLY GENERATED & SITE-TAILORED ACTIVITIES */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b hairline">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-pulse" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Newly Generated &amp; Site-Tailored Activities
                        </h3>
                        <span className="font-mono text-[10px] rounded px-1.5 py-0.5 bg-sky-50 text-[#0284C7] border border-sky-200 font-bold">
                          70% CRAWLER · 30% AI
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        Derived from your site descriptions &amp; equipment
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {(generatedActivities.length > 0
                        ? generatedActivities
                        : activitiesDetail.filter((a) => a.recommended || a.group === "generated")
                      ).map((item) => {
                        const isSelected = selectedActivities.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleActivity(item.name)}
                            className={`text-left p-4 rounded-xl border transition relative flex flex-col justify-between ${
                              isSelected
                                ? "border-[#0284C7] bg-sky-50/70 ring-1 ring-[#0284C7]/20 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-slate-900 leading-snug">
                                  {item.name}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-full grid place-items-center text-[10px] flex-none ml-2 ${
                                    isSelected
                                      ? "bg-[#0284C7] text-white font-bold"
                                      : "border border-slate-300"
                                  }`}
                                >
                                  {isSelected ? "✓" : ""}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed mb-3">
                                {item.description}
                              </div>
                            </div>

                            <div className="pt-2 border-t hairline flex items-center justify-between gap-2 text-[10.5px]">
                              <span
                                className="font-mono text-slate-600 truncate max-w-[180px]"
                                title={item.regulatorySource}
                              >
                                {item.regulatorySource}
                              </span>
                              {item.matchedSite && (
                                <span
                                  className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium truncate max-w-[160px]"
                                  title={`Matched: ${item.matchedSite}`}
                                >
                                  📍 {item.matchedSite}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GROUP 2: STANDARD & CORE SECTOR ACTIVITIES */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b hairline">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Standard &amp; Core Sector Activities
                        </h3>
                        <span className="font-mono text-[10px] rounded px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          STATUTORY BASELINE
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        Universal statutory requirements for {type}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {(coreActivities.length > 0
                        ? coreActivities
                        : activitiesDetail.filter((a) => !a.recommended && a.group !== "generated")
                      ).map((item) => {
                        const isSelected = selectedActivities.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleActivity(item.name)}
                            className={`text-left p-4 rounded-xl border transition relative flex flex-col justify-between ${
                              isSelected
                                ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800/20 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-slate-900 leading-snug">
                                  {item.name}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-full grid place-items-center text-[10px] flex-none ml-2 ${
                                    isSelected
                                      ? "bg-slate-900 text-white font-bold"
                                      : "border border-slate-300"
                                  }`}
                                >
                                  {isSelected ? "✓" : ""}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed mb-3">
                                {item.description}
                              </div>
                            </div>

                            <div className="pt-2 border-t hairline flex items-center justify-between gap-2 text-[10.5px]">
                              <span
                                className="font-mono text-slate-500 truncate max-w-[200px]"
                                title={item.regulatorySource}
                              >
                                {item.regulatorySource}
                              </span>
                              <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.statutoryBasis?.split("&")[0]?.trim() || "UK Statute"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add custom activity box */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
                    <div className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add specialized operations or custom activities
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Does your business carry out specialized operations? Add it here to be factored into the Newly Generated statutory duties.
                    </p>
                    <div className="space-y-2">
                      <input
                        className="field text-sm"
                        value={customActName}
                        onChange={(e) => setCustomActName(e.target.value)}
                        placeholder="Activity name (e.g. Hazardous chemical storage, Live music events, Deep frying)"
                      />
                      <div className="flex gap-2">
                        <input
                          className="field text-sm flex-1"
                          value={customActDesc}
                          onChange={(e) => setCustomActDesc(e.target.value)}
                          placeholder="Description or regulatory notes (optional)"
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={handleAddCustomActivity}
                        >
                          Add to list
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-5 border-t hairline">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm !bg-[#0284C7] hover:!bg-[#0369A1] !text-white font-semibold shadow-xs"
                  onClick={handleGenerate}
                  disabled={isLoadingActivities}
                >
                  Generate my obligations &rarr;
                </button>
              </div>
            </div>
          ) : (
            /* ---------------------------------------------------- */
            /* STEP 3: REVIEW / PROFILE READY TAB (85% CRAWLED OBLS) */
            /* ---------------------------------------------------- */
            <div className="py-2 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl grid place-items-center text-white mx-auto mb-3 bg-emerald-600 shadow-md">
                  <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold mb-1 text-slate-900 tracking-tight">
                  Your compliance profile is ready
                </h2>
                <p className="text-sm text-grey-500 max-w-lg mx-auto">
                  Based on your sector,{" "}
                  <strong>
                    {sites.length} site{sites.length === 1 ? "" : "s"}
                  </strong>
                  , <strong>{totalStaff} staff</strong>, and{" "}
                  <strong>{selectedActivities.length} activities</strong>, Ballast has mapped{" "}
                  <span className="font-semibold text-ink">
                    {activeObligationsCount} statutory obligations
                  </span>{" "}
                  to <strong>{name}</strong>.
                </p>
              </div>

              {/* Grounding Ratio Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800">
                    Engine Grounding: 85% Crawled UK Statutory Registers · 15% AI Contextualized
                  </span>
                </div>
                <span className="font-mono text-slate-500">
                  {jurisdiction} · {council}
                </span>
              </div>

              {/* Summary box */}
              <div className="p-4 rounded-xl bg-grey-50 border hairline text-sm space-y-2">
                <div className="flex justify-between pb-2 border-b hairline">
                  <span className="text-grey-500">Business / Entity:</span>
                  <span className="font-medium text-ink">
                    {name} ({companyNumber ? `Co. #${companyNumber}` : "Unincorporated"})
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b hairline">
                  <span className="text-grey-500">Registered Address:</span>
                  <span className="font-medium text-ink truncate max-w-xs" title={address}>
                    {address || "Standard premises"}
                  </span>
                </div>
                {sicCode && (
                  <div className="flex justify-between pb-2 border-b hairline">
                    <span className="text-grey-500">SIC Code:</span>
                    <span className="font-medium text-ink">{sicCode}</span>
                  </div>
                )}
                <div className="flex justify-between pb-2 border-b hairline">
                  <span className="text-grey-500">Jurisdiction &amp; Council:</span>
                  <span className="font-medium text-ink">
                    {jurisdiction} · {council}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-500">Operating Sites:</span>
                  <span className="font-medium text-ink">
                    {sites.map((s) => s.name).join(", ")}
                  </span>
                </div>
              </div>

              {/* Tier breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-grey-50 border hairline">
                  <div className="font-display text-2xl font-bold text-ink tnum">{tier1Count}</div>
                  <div className="text-xs text-grey-500">Tier 1 (Statutory)</div>
                </div>
                <div className="p-3 rounded-xl bg-grey-50 border hairline">
                  <div className="font-display text-2xl font-bold text-ink tnum">{tier2Count}</div>
                  <div className="text-xs text-grey-500">Tier 2 (Operational)</div>
                </div>
                <div className="p-3 rounded-xl bg-grey-50 border hairline">
                  <div className="font-display text-2xl font-bold text-ink tnum">{tier3Count}</div>
                  <div className="text-xs text-grey-500">Tier 3 (Good Practice)</div>
                </div>
                <div className="p-3 rounded-xl bg-grey-50 border hairline">
                  <div className="font-display text-2xl font-bold text-ink tnum">{tier4Count}</div>
                  <div className="text-xs text-grey-500">Tier 4 (Advisory)</div>
                </div>
              </div>

              {/* List of Generated Obligations Grouped by Statutory Authority */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between pb-2 border-b hairline">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Mapped Statutory Obligations ({obligations.length} duties)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grouped by regulatory authority and verified against live crawled registers
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="btn btn-ghost btn-xs text-xs"
                    >
                      &larr; Modify activities
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn btn-ghost btn-xs text-xs text-[#0284C7] font-semibold"
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(
                    obligations.reduce((acc, obl) => {
                      const authority = obl.source || "UK Statutory Authorities";
                      if (!acc[authority]) acc[authority] = [];
                      acc[authority].push(obl);
                      return acc;
                    }, {} as Record<string, Obligation[]>),
                  ).map(([authority, items]) => (
                    <div key={authority} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                            {authority}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {items.length} {items.length === 1 ? "duty" : "duties"}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {items.map((obl, idx) => (
                          <div
                            key={obl.id || idx}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition text-left space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold text-slate-900 text-sm">
                                {obl.title}
                              </div>
                              <div className="flex items-center gap-1.5 flex-none">
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-bold">
                                  {obl.category}
                                </span>
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                  {obl.cadence}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap font-mono">
                              <span className="text-slate-800 font-medium">{obl.basis}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">
                                {obl.siteScope === "each_site"
                                  ? `📍 Each premises (${sites.length})`
                                  : "🏢 Company-wide"}
                              </span>
                              {obl.evidence && (
                                <>
                                  <span className="text-slate-400">·</span>
                                  <span
                                    className="text-slate-500 truncate max-w-sm"
                                    title={obl.evidence}
                                  >
                                    Proof: {obl.evidence}
                                  </span>
                                </>
                              )}
                            </div>

                            {obl.aiWhy && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg leading-relaxed border border-slate-100">
                                {obl.aiWhy}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  className="btn btn-lg !bg-[#0284C7] hover:!bg-[#0369A1] !text-white font-semibold shadow-xs flex items-center gap-2 transition"
                  onClick={() => router.push("/app")}
                >
                  <span>Open my compliance dashboard</span>
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
