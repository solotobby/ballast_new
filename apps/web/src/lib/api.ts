import type { FormField, FormSchema } from "@ballast/domain";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as { message?: string | string[] } & T) : ({} as T);

  if (!response.ok) {
    const message = Array.isArray((data as { message?: string | string[] }).message)
      ? ((data as { message: string[] }).message[0] ?? "Request failed")
      : ((data as { message?: string }).message ?? "Request failed");
    throw new ApiError(response.status, message);
  }
  return data;
}

async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { message?: string | string[] } & T) : ({} as T);
  if (!response.ok) {
    const message = Array.isArray((data as { message?: string | string[] }).message)
      ? ((data as { message: string[] }).message[0] ?? "Request failed")
      : ((data as { message?: string }).message ?? "Request failed");
    throw new ApiError(response.status, message);
  }
  return data;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  organisationId: string;
  organisationName: string;
  role: string;
  siteId: string | null;
};

export type InvitePreview = {
  email: string;
  role: string;
  roleLabel: string;
  organisationName: string;
  siteName: string | null;
  status: string;
  requiresPassword: boolean;
};

export type OnboardingStep = "profile" | "activities" | "review" | "invite" | "done";

export type Invite = {
  id: string;
  email: string;
  role: "site_manager" | "staff" | string;
  status: string;
  site: { id: string; name: string } | null;
};

export type Organisation = {
  id: string;
  name: string;
  legalName?: string | null;
  companyNumber?: string | null;
  sicCode?: string | null;
  address?: string | null;
  jurisdiction?: string | null;
  council?: string | null;
  sector: string | null;
  sizeBand: string | null;
  siteCount: number;
  activities: string[];
  extraNotes: string | null;
  sites: {
    id: string;
    name: string;
    address?: string | null;
    postcode?: string | null;
    kind?: string | null;
    staffCount?: number;
    description?: string | null;
  }[];
  invites: Invite[];
  onboardingStep: OnboardingStep;
  profileComplete: boolean;
};

export type TeamSite = {
  id: string;
  name: string;
  address: string | null;
  kind: string | null;
  coverage: number;
  coverageTone: "ok" | "due" | "over";
  staffCount: number;
  leadName: string | null;
  leadPending: boolean;
};

export type TeamMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  siteId: string | null;
  siteName: string | null;
  scope: string;
  status: "active";
  lastActiveLabel: string;
  avatarColor: string;
};

export type TeamInviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  site: { id: string; name: string } | null;
  name: string;
  scope: string;
  lastActiveLabel: string;
  avatarColor: string;
};

export type TeamOverview = {
  sites: TeamSite[];
  members: TeamMember[];
  invites: TeamInviteRow[];
  siteCount: number;
};

export type ReportLibraryItem = {
  id: string;
  title: string;
  authority: string;
  kind: string;
  progress: number;
  status: "ready" | "draft" | "blocked";
  dueLabel: string;
  blocker: string | null;
  obligationCount: number;
  coveredCount: number;
};

export type ReportLibrary = {
  headline: string;
  readyCount: number;
  blockedCount: number;
  obligationCount: number;
  evidenceCount: number;
  logCount: number;
  items: ReportLibraryItem[];
};

export type GeneratedReport = {
  id: string;
  templateId: string;
  title: string;
  authority: string;
  kind: string;
  status: string;
  progress: number;
  dueLabel: string | null;
  blocker: string | null;
  content: {
    generatedBy?: string;
    summary?: string;
    obligations?: {
      title: string;
      category: string;
      status: string;
      basis: string;
      cadence: string;
      evidenceHint: string;
    }[];
    evidence?: { name: string; obligation: string | null; createdAt: string }[];
    recentLogs?: {
      type: string;
      description: string;
      site: string;
      obligation: string | null;
      createdAt: string;
    }[];
  } | null;
  generatedAt: string | null;
  createdAt: string;
};

export type Obligation = {
  id: string;
  definitionId: string;
  title: string;
  category: string;
  basis: string;
  cadence: string;
  evidence: string;
  ownerRole: string;
  siteScope: string;
  status: string;
  reviewState: "pending" | "confirmed" | "flagged";
  flagReason: string | null;
  source: "rules" | "ai";
  rulesVersion: string;
  aiConfidence: "low" | "medium" | "high" | null;
  aiWhy: string | null;
  lastEvidenceAt?: string | null;
  nextDueAt?: string | null;
  statusManual?: boolean;
  formProgress?: {
    percent: number;
    complete: boolean;
    requiredFilled: number;
    requiredTotal: number;
    submissionStatus: string | null;
  } | null;
};

export type LogEntry = {
  id: string;
  type: string;
  category: string;
  description: string;
  createdByName: string;
  createdAt: string;
  site: { id: string; name: string };
  obligation: { id: string; title: string; definitionId: string } | null;
  evidence: { id: string; name: string; mimeType: string }[];
};

export type EvidenceRecord = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string | null;
  createdByName: string;
  createdAt: string;
  obligation: { id: string; title: string; definitionId: string } | null;
  site: { id: string; name: string } | null;
};

export type ShareGrant = {
  id: string;
  token: string;
  title: string;
  obligationIds: string[];
  createdByName: string;
  revokedAt: string | null;
  createdAt: string;
};

export type PublicShare = {
  title: string;
  organisationName: string;
  sector: string | null;
  siteCount: number;
  createdAt: string;
  coverage: number;
  obligations: { title: string; category: string; basis: string; cadence: string; status: string }[];
};

export type ObligationFormField = FormField;

export type ObligationFormBundle = {
  obligation: {
    id: string;
    definitionId: string;
    title: string;
    category: string;
    basis: string;
    cadence: string;
    evidence: string;
    reviewState: string;
    status: string;
  };
  template: {
    id: string;
    definitionId: string;
    version: number;
    title: string;
    purpose: string | null;
    schema: FormSchema;
    source: string;
    aiConfidence: string | null;
    aiWhy: string | null;
  };
  submission: {
    id: string;
    templateId: string;
    templateVersion: number;
    answers: Record<string, unknown>;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    updatedAt: string;
  } | null;
  progress: {
    percent: number;
    complete: boolean;
    requiredFilled: number;
    requiredTotal: number;
    optionalFilled: number;
    optionalTotal: number;
  };
};

export type ActivityOptions = {
  activities: string[];
  source: "ai" | "fallback";
  model: string | null;
};

export const client = {
  signUp: (body: { businessName: string; email: string; password: string }) =>
    api<{ user: SessionUser }>("/auth/sign-up", { method: "POST", body: JSON.stringify(body) }),
  signIn: (body: { email: string; password: string }) =>
    api<{ user: SessionUser }>("/auth/sign-in", { method: "POST", body: JSON.stringify(body) }),
  previewInvite: (token: string) => api<InvitePreview>(`/public/invites/${token}`),
  acceptInvite: (body: { token: string; name?: string; password?: string }) =>
    api<{ user: SessionUser }>("/auth/accept-invite", { method: "POST", body: JSON.stringify(body) }),
  me: () => api<{ user: SessionUser }>("/auth/me"),
  updateMe: (body: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api<{ user: SessionUser }>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  signOut: () => api<{ ok: boolean }>("/auth/sign-out", { method: "POST" }),
  organisation: () => api<Organisation>("/organisations/me"),
  updateProfile: (body: {
    name?: string;
    legalName?: string;
    companyNumber?: string;
    sicCode?: string;
    address?: string;
    jurisdiction?: string;
    council?: string;
    sector: string;
    sizeBand: string;
    siteCount: number;
    sites?: Array<{
      id?: string;
      name: string;
      address?: string;
      postcode?: string;
      staffCount?: number;
      description?: string;
    }>;
    activities?: string[];
    extraNotes?: string;
    onboardingStep?: OnboardingStep;
  }) => api<Organisation>("/organisations/me/profile", { method: "PATCH", body: JSON.stringify(body) }),
  setOnboardingStep: (step: OnboardingStep) =>
    api<Organisation>("/organisations/me/onboarding", { method: "PATCH", body: JSON.stringify({ step }) }),
  listInvites: () => api<Invite[]>("/organisations/me/invites"),
  createInvite: (body: { email: string; role: "site_manager" | "staff"; siteId?: string }) =>
    api<Invite>("/organisations/me/invites", { method: "POST", body: JSON.stringify(body) }),
  team: () => api<TeamOverview>("/team"),
  createSite: (body: {
    name: string;
    address?: string;
    postcode?: string;
    kind?: string;
    staffCount?: number;
    description?: string;
  }) =>
    api<{
      id: string;
      name: string;
      address: string | null;
      postcode: string | null;
      kind: string | null;
      staffCount: number;
      description: string | null;
    }>("/team/sites", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSite: (
    id: string,
    body: {
      name?: string;
      address?: string;
      postcode?: string;
      kind?: string;
      staffCount?: number;
      description?: string;
    },
  ) =>
    api<{
      id: string;
      name: string;
      address: string | null;
      postcode: string | null;
      kind: string | null;
      staffCount: number;
      description: string | null;
    }>(`/team/sites/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  revokeInvite: (id: string) => api<{ ok: boolean }>(`/team/invites/${id}`, { method: "DELETE" }),
  updateMember: (id: string, body: { role?: "site_manager" | "staff"; siteId?: string | null }) =>
    api<unknown>(`/team/members/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  reportLibrary: () => api<ReportLibrary>("/reports"),
  generateReport: (templateId: string) =>
    api<GeneratedReport>(`/reports/${templateId}/generate`, { method: "POST" }),
  listGeneratedReports: () => api<GeneratedReport[]>("/reports/generated"),
  getGeneratedReport: (id: string) => api<GeneratedReport>(`/reports/generated/${id}`),
  activitiesForSector: (sector: string) =>
    api<ActivityOptions>(`/onboarding/activities?sector=${encodeURIComponent(sector)}`),
  suggestActivities: (body: {
    sector: string;
    businessName: string;
    jurisdiction?: string;
    council?: string;
    sicCode?: string;
    companyNumber?: string;
    address?: string;
    sites: Array<{
      id?: string;
      name: string;
      location?: string;
      postcode?: string;
      staffCount?: number | string;
      description?: string;
    }>;
  }) =>
    api<{
      activities: [string, string][];
      activitiesDetail: Array<{
        name: string;
        description: string;
        regulatorySource: string;
        statutoryBasis: string;
        category: string;
        group?: "core" | "generated";
        recommended: boolean;
        matchedSite?: string;
      }>;
      coreActivities: Array<{
        name: string;
        description: string;
        regulatorySource: string;
        statutoryBasis: string;
        category: string;
        group?: "core" | "generated";
        recommended: boolean;
        matchedSite?: string;
      }>;
      generatedActivities: Array<{
        name: string;
        description: string;
        regulatorySource: string;
        statutoryBasis: string;
        category: string;
        group?: "core" | "generated";
        recommended: boolean;
        matchedSite?: string;
      }>;
      ratio: string;
      sourcesUsed: Array<{ code: string; name: string; portalUrl: string }>;
      source: string;
      model: string | null;
    }>("/onboarding/suggest-activities", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateObligations: () =>
    api<{ packId: string; rulesVersion: string; obligations: Obligation[] }>("/obligations/generate", {
      method: "POST",
    }),
  listObligations: () => api<Obligation[]>("/obligations"),
  confirmObligation: (id: string) => api<Obligation>(`/obligations/${id}/confirm`, { method: "POST" }),
  confirmAllObligations: () => api<Obligation[]>("/obligations/confirm-all", { method: "POST" }),
  flagObligation: (id: string, reason?: string) =>
    api<Obligation>(`/obligations/${id}/flag`, { method: "POST", body: JSON.stringify({ reason }) }),
  updateObligationStatus: (id: string, status: string) =>
    api<Obligation>(`/obligations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getObligationForm: (id: string) => api<ObligationFormBundle>(`/obligations/${id}/form`),
  generateObligationForm: (id: string, force = false) =>
    api<ObligationFormBundle>(`/obligations/${id}/form/generate?force=${force ? "1" : "0"}`, { method: "POST" }),
  saveObligationFormAnswers: (id: string, answers: Record<string, unknown>) =>
    api<ObligationFormBundle>(`/obligations/${id}/form/answers`, {
      method: "PUT",
      body: JSON.stringify({ answers }),
    }),
  submitObligationForm: (id: string, answers: Record<string, unknown>) =>
    api<ObligationFormBundle>(`/obligations/${id}/form/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  listLogs: () => api<LogEntry[]>("/logbook"),
  createLog: (form: FormData) => apiForm<LogEntry>("/logbook", form),
  listEvidence: () => api<EvidenceRecord[]>("/evidence"),
  uploadEvidence: (form: FormData) => apiForm<EvidenceRecord>("/evidence", form),
  listShares: () => api<ShareGrant[]>("/shares"),
  createShare: (body: { title: string; obligationIds?: string[] }) =>
    api<ShareGrant>("/shares", { method: "POST", body: JSON.stringify(body) }),
  revokeShare: (id: string) => api<ShareGrant>(`/shares/${id}/revoke`, { method: "POST" }),
  publicShare: (token: string) => api<PublicShare>(`/public/shares/${token}`),
};
