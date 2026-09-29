import type { ReportLibrary } from "@/lib/api";

export function reportsBlockerCopy(library: ReportLibrary): string {
  if (library.obligationCount === 0) {
    return "Your duty register is empty. Generate obligations from your business profile before statutory packs can auto-fill.";
  }
  if (library.blockedCount === 0) {
    if (library.evidenceCount === 0 && library.logCount === 0) {
      return "No blockers on overdue duties, but packs need evidence or logbook entries before they can reach ready status.";
    }
    return "All report packs that depend on overdue duties are clear. Keep logging to stay ready.";
  }
  return (
    library.items.find((item) => item.status === "blocked")?.blocker ??
    "Resolve overdue obligations to unlock blocked reports."
  );
}

export function reportsBlockerTitle(library: ReportLibrary): string {
  if (library.obligationCount === 0) return "Register required";
  if (library.blockedCount === 0) return "No blockers";
  return `${library.blockedCount} report${library.blockedCount === 1 ? "" : "s"} blocked`;
}

export function reportsFooter(library: ReportLibrary, generatedCount: number): string {
  if (library.obligationCount === 0) {
    return "Statutory report templates are ready — your register, vault and logbook will drive auto-fill once data exists.";
  }
  const parts = [
    `${library.obligationCount} obligation${library.obligationCount === 1 ? "" : "s"}`,
    `${library.evidenceCount} vault file${library.evidenceCount === 1 ? "" : "s"}`,
    `${library.logCount} logbook ${library.logCount === 1 ? "entry" : "entries"}`,
  ];
  if (generatedCount > 0) {
    parts.push(`${generatedCount} generated pack${generatedCount === 1 ? "" : "s"}`);
  }
  return `Report readiness is calculated from ${parts.join(", ")}.`;
}
