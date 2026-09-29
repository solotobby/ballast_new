export type ReportTemplateId =
  | "fsa_preinspection"
  | "fire_safety_statement"
  | "hse_annual"
  | "supplier_summary";

export type ReportLibraryStatus = "ready" | "draft" | "blocked";

export type ReportTemplate = {
  id: ReportTemplateId;
  title: string;
  authority: string;
  kind: "On demand" | "Ad-hoc" | "Scheduled";
  categories: string[];
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "fsa_preinspection",
    title: "Food Hygiene — Pre-inspection Evidence Pack",
    authority: "FSA / Local EHO",
    kind: "On demand",
    categories: ["food"],
  },
  {
    id: "fire_safety_statement",
    title: "Fire Safety Compliance Statement",
    authority: "Fire & Rescue Service",
    kind: "Ad-hoc",
    categories: ["fire"],
  },
  {
    id: "hse_annual",
    title: "Employer’s Annual H&S Return",
    authority: "HSE",
    kind: "Scheduled",
    categories: ["hs", "employ"],
  },
  {
    id: "supplier_summary",
    title: "Supplier Compliance Summary (bid)",
    authority: "Buyer / contractor",
    kind: "On demand",
    categories: [],
  },
];

export function matchesCategory(obligationCategory: string, categories: string[]) {
  if (categories.length === 0) return true;
  const needle = obligationCategory.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return categories.some((cat) => {
    const c = cat.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return needle.includes(c) || c.includes(needle) || obligationCategory.toLowerCase().includes(cat.toLowerCase());
  });
}
