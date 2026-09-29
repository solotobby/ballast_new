import type { Sector } from "@ballast/domain";

export type GeneratedActivitySet = {
  activities: string[];
  source: "ai" | "fallback";
  model: string | null;
};

export type SiteProfileInput = {
  id?: string;
  name: string;
  location?: string;
  postcode?: string;
  staffCount?: number | string;
  description?: string;
};

export type SuggestedActivity = {
  name: string;
  description: string;
  regulatorySource: string;
  statutoryBasis: string;
  category: string;
  group?: "core" | "generated";
  recommended: boolean;
  matchedSite?: string;
};

export type SuggestedActivitySet = {
  activities: [string, string][]; // [name, description] tuples for backward-compatible rendering
  activitiesDetail: SuggestedActivity[];
  coreActivities: SuggestedActivity[];
  generatedActivities: SuggestedActivity[];
  ratio: "70:30 (70% Crawled Regulatory Sources : 30% AI Contextualization)";
  sourcesUsed: { code: string; name: string; portalUrl: string }[];
  source: "crawled_ai" | "crawled_fallback";
  model: string | null;
};

export type SuggestActivitiesInput = {
  sector: Sector;
  businessName: string;
  jurisdiction?: string;
  council?: string;
  sicCode?: string;
  companyNumber?: string;
  address?: string;
  sites: SiteProfileInput[];
};

export type GeneratedObligation = {
  id: string;
  category: string;
  title: string;
  basis: string;
  source?: string;
  cadence: string;
  evidence: string;
  ownerRole: string;
  siteScope: "all" | "each_site";
  confidence: "low" | "medium" | "high";
  why: string;
};

export type GeneratedObligationSet = {
  obligations: GeneratedObligation[];
  source: "ai" | "fallback";
  model: string;
  groundingRatio?: string;
};

export type ObligationProfileInput = {
  organisationName: string;
  legalName?: string;
  companyNumber?: string;
  sicCode?: string;
  address?: string;
  jurisdiction?: string;
  council?: string;
  sector: Sector;
  sizeBand: string;
  siteCount: number;
  sites?: SiteProfileInput[];
  activities: string[];
  extraNotes?: string;
};

export type GeneratedFormField = {
  id: string;
  type: string;
  label: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string;
  evidenceHint?: string;
  visibility?: { fieldId: string; equals: string | number | boolean };
};

export type GeneratedFormSchema = {
  title: string;
  purpose: string;
  confidence: "low" | "medium" | "high";
  why: string;
  fields: GeneratedFormField[];
  source: "ai" | "fallback";
  model: string | null;
};

export type ObligationFormInput = {
  organisationName: string;
  sector: string;
  sizeBand: string;
  siteCount: number;
  activities: string[];
  extraNotes?: string;
  definitionId: string;
  title: string;
  category: string;
  basis: string;
  cadence: string;
  evidenceHint: string;
  ownerRole: string;
};
