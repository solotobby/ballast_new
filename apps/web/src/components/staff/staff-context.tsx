"use client";

import { LOG_TYPES } from "@ballast/domain";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { client, type EvidenceRecord, type LogEntry, type Obligation, type Organisation, type SessionUser } from "@/lib/api";
import { STAFF_TASK_TEMPLATES, type StaffTask, type StaffTaskStatus } from "./types";

type SheetState =
  | { kind: "closed" }
  | { kind: "quick-add" }
  | { kind: "upload" }
  | { kind: "task"; taskId: string }
  | { kind: "incident"; title: string }
  | { kind: "refusal" };

type StaffContextValue = {
  user: SessionUser | null;
  org: Organisation | null;
  siteName: string;
  siteId: string;
  logs: LogEntry[];
  evidence: EvidenceRecord[];
  obligations: Obligation[];
  tasks: StaffTask[];
  loading: boolean;
  toast: string | null;
  sheet: SheetState;
  taskFilter: "today" | "recurring" | "done";
  setTaskFilter: (f: "today" | "recurring" | "done") => void;
  openSheet: (sheet: SheetState) => void;
  closeSheet: () => void;
  showToast: (msg: string) => void;
  completeTask: (taskId: string, description: string, file?: File) => Promise<void>;
  createLog: (input: {
    type: string;
    category: string;
    description: string;
    obligationId?: string;
    file?: File;
  }) => Promise<void>;
  uploadEvidence: (input: { obligationId: string; file: File }) => Promise<void>;
  refresh: () => Promise<void>;
};

const StaffContext = createContext<StaffContextValue | null>(null);

function storageKey(siteId: string) {
  return `ballast-staff-tasks-${siteId}-${new Date().toISOString().slice(0, 10)}`;
}

function defaultStatuses(): Record<string, StaffTaskStatus> {
  return {
    opening: "done",
    temps: "due",
    allergen: "due",
    "fire-walk": "upcoming",
    handwash: "upcoming",
    closing: "upcoming",
  };
}

function buildTasks(siteId: string, obligations: { id: string; category: string }[]): StaffTask[] {
  let stored: Record<string, StaffTaskStatus> = {};
  if (typeof window !== "undefined") {
    try {
      stored = JSON.parse(localStorage.getItem(storageKey(siteId)) ?? "{}") as Record<string, StaffTaskStatus>;
    } catch {
      stored = {};
    }
  }
  const defaults = defaultStatuses();

  return STAFF_TASK_TEMPLATES.map((template) => {
    const obligation = obligations.find((o) => o.category === template.category);
    return {
      ...template,
      status: stored[template.id] ?? defaults[template.id] ?? "upcoming",
      obligationId: obligation?.id,
    };
  });
}

function persistTasks(siteId: string, tasks: StaffTask[]) {
  const map = Object.fromEntries(tasks.map((t) => [t.id, t.status]));
  localStorage.setItem(storageKey(siteId), JSON.stringify(map));
}

export function StaffProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>({ kind: "closed" });
  const [taskFilter, setTaskFilter] = useState<"today" | "recurring" | "done">("today");

  const siteId = user?.siteId ?? org?.sites[0]?.id ?? "";
  const siteName =
    org?.sites.find((s) => s.id === siteId)?.name ?? org?.sites[0]?.name ?? "Your site";

  const refresh = useCallback(async () => {
    const [me, organisation, logItems, evidenceItems, obligations] = await Promise.all([
      client.me(),
      client.organisation(),
      client.listLogs(),
      client.listEvidence(),
      client.listObligations(),
    ]);

    if (me.user.role === "owner") {
      router.replace("/app");
      return;
    }

    if (!me.user.siteId && organisation.sites[0]) {
      // site manager/staff without site assignment — still allow, use first site for display
    }

    const resolvedSiteId = me.user.siteId ?? organisation.sites[0]?.id ?? "";
    setUser(me.user);
    setOrg(organisation);
    setLogs(logItems);
    setEvidence(evidenceItems);
    setObligations(obligations);
    setTasks(buildTasks(resolvedSiteId, obligations));
  }, [router]);

  useEffect(() => {
    refresh()
      .catch(() => router.replace("/signin"))
      .finally(() => setLoading(false));
  }, [refresh, router]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const createLog = useCallback(
    async (input: {
      type: string;
      category: string;
      description: string;
      obligationId?: string;
      file?: File;
    }) => {
      if (!siteId) throw new Error("No site assigned");
      const form = new FormData();
      form.set("type", input.type);
      form.set("category", input.category);
      form.set("description", input.description);
      form.set("siteId", siteId);
      if (input.obligationId) form.set("obligationId", input.obligationId);
      if (input.file) form.set("file", input.file);
      await client.createLog(form);
      await refresh();
    },
    [siteId, refresh],
  );

  const completeTask = useCallback(
    async (taskId: string, description: string, file?: File) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const logType = LOG_TYPES.find((t) => t.id === task.logType) ?? LOG_TYPES[0]!;
      await createLog({
        type: logType.label,
        category: task.category === "hs" ? "hs" : task.category,
        description,
        obligationId: task.obligationId,
        file,
      });

      setTasks((current) => {
        const next = current.map((t) => (t.id === taskId ? { ...t, status: "done" as const } : t));
        const hasDue = next.some((t) => t.status === "due");
        if (hasDue) {
          persistTasks(siteId, next);
          return next;
        }
        const firstUpcoming = next.find((t) => t.status === "upcoming");
        const promoted = firstUpcoming
          ? next.map((t) => (t.id === firstUpcoming.id ? { ...t, status: "due" as const } : t))
          : next;
        persistTasks(siteId, promoted);
        return promoted;
      });

      await refresh();
      showToast("Logged & filed");
      setSheet({ kind: "closed" });
    },
    [tasks, createLog, siteId, refresh, showToast],
  );

  const uploadEvidence = useCallback(
    async (input: { obligationId: string; file: File }) => {
      if (!siteId) throw new Error("No site assigned");
      const form = new FormData();
      form.set("obligationId", input.obligationId);
      form.set("siteId", siteId);
      form.set("file", input.file);
      await client.uploadEvidence(form);
      await refresh();
      showToast("Evidence uploaded");
      setSheet({ kind: "closed" });
    },
    [siteId, refresh, showToast],
  );

  const value = useMemo(
    () => ({
      user,
      org,
      siteName,
      siteId,
      logs,
      evidence,
      obligations,
      tasks,
      loading,
      toast,
      sheet,
      taskFilter,
      setTaskFilter,
      openSheet: setSheet,
      closeSheet: () => setSheet({ kind: "closed" }),
      showToast,
      completeTask,
      createLog,
      uploadEvidence,
      refresh,
    }),
    [
      user,
      org,
      siteName,
      siteId,
      logs,
      evidence,
      obligations,
      tasks,
      loading,
      toast,
      sheet,
      taskFilter,
      showToast,
      completeTask,
      createLog,
      uploadEvidence,
      refresh,
    ],
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used within StaffProvider");
  return ctx;
}

export type { SheetState };
