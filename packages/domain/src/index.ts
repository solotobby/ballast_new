export type OrganisationId = string;
export type SiteId = string;
export type UserId = string;
export type ObligationDefinitionId = string;

export type UserRole = "owner" | "site_manager" | "staff" | "buyer" | "insurer" | "ops";

export type ObligationStatus = "on_track" | "due_soon" | "overdue" | "evidence_gap";

export const OBLIGATION_STATUSES: { id: ObligationStatus; label: string }[] = [
  { id: "on_track", label: "On track" },
  { id: "due_soon", label: "Due soon" },
  { id: "overdue", label: "Overdue" },
  { id: "evidence_gap", label: "Evidence gap" },
];

export type ObligationReviewState = "pending" | "confirmed" | "flagged";

export type ObligationSource = "rules" | "ai";

export type Sector = "hospitality" | "construction" | "care" | "retail" | "property";

export type SizeBand = "just_me" | "2_10" | "11_50" | "51_250";

export const SIZE_BANDS: { id: SizeBand; label: string }[] = [
  { id: "just_me", label: "Just me" },
  { id: "2_10", label: "2–10" },
  { id: "11_50", label: "11–50" },
  { id: "51_250", label: "51–250" },
];

export const SECTORS: { id: Sector; emoji: string; label: string }[] = [
  { id: "hospitality", emoji: "🍽️", label: "Hospitality & food" },
  { id: "construction", emoji: "🏗️", label: "Construction & trades" },
  { id: "care", emoji: "🧑‍⚕️", label: "Care & childcare" },
  { id: "retail", emoji: "🛒", label: "Licensed retail" },
  { id: "property", emoji: "🏢", label: "Property & facilities" },
];

export type Activity = string;

export interface Organisation {
  id: OrganisationId;
  name: string;
  legalName?: string | null;
  companyNumber?: string | null;
  sicCode?: string | null;
  address?: string | null;
  jurisdiction?: string | null;
  council?: string | null;
  sector: Sector | null;
  sizeBand: SizeBand | null;
  siteCount: number;
  activities: Activity[];
}

export interface Site {
  id: SiteId;
  organisationId: OrganisationId;
  name: string;
  address?: string | null;
  postcode?: string | null;
  kind?: string | null;
  staffCount?: number;
  description?: string | null;
}

export interface BusinessProfile {
  sector: Sector;
  sizeBand: SizeBand;
  siteCount: number;
  activities: Activity[];
  extraNotes?: string;
}

export interface ObligationDefinition {
  id: ObligationDefinitionId;
  category: string;
  title: string;
  basis: string;
  cadence: string;
  evidence: string;
  ownerRole: string;
  siteScope: "all" | "each_site";
  source?: ObligationSource;
  when: {
    sectors: Sector[];
    activitiesAny?: Activity[];
    activitiesAll?: Activity[];
    minSites?: number;
    employsStaff?: boolean;
  };
}

export interface OrganisationObligation {
  id: string;
  organisationId: OrganisationId;
  definitionId: ObligationDefinitionId;
  title: string;
  category: string;
  basis: string;
  cadence: string;
  evidence: string;
  ownerRole: string;
  status: ObligationStatus;
  reviewState: ObligationReviewState;
  flagReason: string | null;
  source: ObligationSource;
  rulesVersion: string;
  aiConfidence: "low" | "medium" | "high" | null;
  aiWhy: string | null;
}

export interface AiProvenance {
  model: string;
  promptHash: string;
  rulesVersion: string;
  confidence: "low" | "medium" | "high";
}

export interface SessionUser {
  id: UserId;
  email: string;
  name: string | null;
  organisationId: OrganisationId;
  organisationName: string;
  role: UserRole;
}

export const LOG_TYPES: { id: string; label: string; category: string }[] = [
  { id: "fridge_check", label: "Fridge temperature check", category: "food" },
  { id: "food_check", label: "Food safety / HACCP check", category: "food" },
  { id: "fire_check", label: "Fire safety check", category: "fire" },
  { id: "age_refusal", label: "Age-verification refusal", category: "licence" },
  { id: "incident", label: "Incident", category: "hs" },
  { id: "near_miss", label: "Near miss", category: "hs" },
  { id: "site_check", label: "Site / competency check", category: "construction" },
  { id: "safeguarding", label: "Safeguarding / medication check", category: "care" },
  { id: "other", label: "Other check", category: "other" },
];

export function deriveObligationStatus(
  cadence: string,
  lastEvidenceAt: Date | null,
  now = new Date(),
): { status: ObligationStatus; nextDueAt: Date | null } {
  if (!lastEvidenceAt) return { status: "evidence_gap", nextDueAt: null };

  const periodDays = cadencePeriodDays(cadence);
  if (periodDays === null) return { status: "on_track", nextDueAt: null };

  const nextDueAt = new Date(lastEvidenceAt.getTime() + periodDays * 24 * 60 * 60 * 1000);
  if (now.getTime() > nextDueAt.getTime()) return { status: "overdue", nextDueAt };

  const dueSoonMs = dueSoonWindowDays(periodDays) * 24 * 60 * 60 * 1000;
  if (nextDueAt.getTime() - now.getTime() <= dueSoonMs) return { status: "due_soon", nextDueAt };
  return { status: "on_track", nextDueAt };
}

function cadencePeriodDays(cadence: string): number | null {
  const value = cadence.toLowerCase();
  if (value.includes("daily")) return 1;
  if (value.includes("weekly")) return 7;
  if (value.includes("monthly")) return 31;
  if (value.includes("annual") || value.includes("yearly")) return 365;
  return null;
}

function dueSoonWindowDays(periodDays: number): number {
  if (periodDays <= 1) return 0.35;
  if (periodDays <= 7) return 1;
  if (periodDays <= 31) return 5;
  return 30;
}

/* ── Reusable obligation questionnaires (form builder) ── */

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiselect"
  | "file"
  | "attestation";

export type FormSubmissionStatus = "draft" | "submitted" | "needs_info" | "approved" | "rejected";

export const FORM_SUBMISSION_STATUSES: { id: FormSubmissionStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "needs_info", label: "Needs info" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldVisibility {
  fieldId: string;
  equals: string | number | boolean;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  accept?: string;
  evidenceHint?: string;
  visibility?: FormFieldVisibility;
}

export interface FormSchema {
  version: 1;
  fields: FormField[];
}

export type FormAnswers = Record<string, unknown>;

export function isFieldVisible(field: FormField, answers: FormAnswers): boolean {
  if (!field.visibility) return true;
  return answers[field.visibility.fieldId] === field.visibility.equals;
}

export function isAnswerFilled(field: FormField, value: unknown): boolean {
  if (field.type === "attestation") return value === true;
  if (field.type === "boolean") return value === true || value === false;
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  return Boolean(value);
}

export interface FormCompletion {
  requiredTotal: number;
  requiredFilled: number;
  optionalTotal: number;
  optionalFilled: number;
  percent: number;
  complete: boolean;
}

export function measureFormCompletion(schema: FormSchema, answers: FormAnswers): FormCompletion {
  let requiredTotal = 0;
  let requiredFilled = 0;
  let optionalTotal = 0;
  let optionalFilled = 0;

  for (const field of schema.fields) {
    if (!isFieldVisible(field, answers)) continue;
    const filled = isAnswerFilled(field, answers[field.id]);
    if (field.required) {
      requiredTotal += 1;
      if (filled) requiredFilled += 1;
    } else {
      optionalTotal += 1;
      if (filled) optionalFilled += 1;
    }
  }

  const percent = requiredTotal === 0 ? 100 : Math.round((requiredFilled / requiredTotal) * 100);

  return {
    requiredTotal,
    requiredFilled,
    optionalTotal,
    optionalFilled,
    percent,
    complete: requiredTotal === 0 || requiredFilled === requiredTotal,
  };
}

export function validateFormAnswers(schema: FormSchema, answers: FormAnswers): string[] {
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (!isFieldVisible(field, answers) || !field.required) continue;
    if (!isAnswerFilled(field, answers[field.id])) {
      errors.push(`${field.label} is required`);
    }
  }
  return errors;
}

/** Map questionnaire progress + submission state → obligation status. */
export function statusFromFormProgress(
  progress: FormCompletion,
  submissionStatus: FormSubmissionStatus | null | undefined,
): ObligationStatus {
  if (submissionStatus === "approved" || submissionStatus === "submitted") return "on_track";
  if (submissionStatus === "rejected" || submissionStatus === "needs_info") return "evidence_gap";
  if (progress.percent <= 0) return "evidence_gap";
  if (!progress.complete) return "due_soon";
  return "due_soon";
}
