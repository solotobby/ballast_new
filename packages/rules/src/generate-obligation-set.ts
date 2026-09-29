import type { Activity, BusinessProfile, ObligationDefinition } from "@ballast/domain";
import hospitalityPack from "../packs/hospitality/v2026.3.json";

export interface RulesPack {
  id: string;
  version: string;
  sector: string;
  obligations: ObligationDefinition[];
}

export const HOSPITALITY_PACK = hospitalityPack as RulesPack;

const EMPLOYS_STAFF: Activity = "Employs staff";

export function packForSector(sector: BusinessProfile["sector"]): RulesPack | null {
  if (sector === "hospitality") return HOSPITALITY_PACK;
  return null;
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectedIncludes(selected: string[], required: string): boolean {
  const need = normalise(required);
  return selected.some((item) => {
    const got = normalise(item);
    return got === need || got.includes(need) || need.includes(got);
  });
}

export function matchesDefinition(profile: BusinessProfile, definition: ObligationDefinition): boolean {
  const { when } = definition;
  if (!when.sectors.includes(profile.sector)) return false;
  if (when.minSites && profile.siteCount < when.minSites) return false;
  if (when.employsStaff && !selectedIncludes(profile.activities, EMPLOYS_STAFF)) return false;
  if (when.activitiesAll?.some((activity) => !selectedIncludes(profile.activities, activity))) return false;
  if (when.activitiesAny && !when.activitiesAny.some((activity) => selectedIncludes(profile.activities, activity))) {
    return false;
  }
  return true;
}

export function generateObligationSet(profile: BusinessProfile): {
  pack: RulesPack;
  obligations: ObligationDefinition[];
} {
  const pack = packForSector(profile.sector);
  if (!pack) {
    return { pack: { id: "NONE", version: "v0", sector: profile.sector, obligations: [] }, obligations: [] };
  }
  return {
    pack,
    obligations: pack.obligations.filter((definition) => matchesDefinition(profile, definition)),
  };
}
