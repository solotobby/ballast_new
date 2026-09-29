import type { FormSchema } from "@ballast/domain";

/** Category-seeded questionnaires when AI is unavailable. */
export function fallbackFormSchema(input: {
  definitionId: string;
  category: string;
  title: string;
  evidenceHint: string;
}): { title: string; purpose: string; schema: FormSchema; confidence: "low" | "medium" | "high" } {
  const category = input.category.toLowerCase();
  const base = sharedFields(input);

  const byCategory: Record<string, FormSchema["fields"]> = {
    food: [
      {
        id: "sfbb_in_place",
        type: "boolean",
        label: "Do you operate a Safer Food, Better Business (SFBB) or equivalent HACCP system?",
        required: true,
      },
      {
        id: "food_hygiene_rating",
        type: "select",
        label: "Current Food Hygiene Rating",
        required: true,
        options: [
          { value: "5", label: "5 – Very good" },
          { value: "4", label: "4 – Good" },
          { value: "3", label: "3 – Generally satisfactory" },
          { value: "2_or_below", label: "2 or below / awaiting" },
          { value: "not_rated", label: "Not yet rated" },
        ],
      },
      {
        id: "temp_logging",
        type: "attestation",
        label: "We keep fridge / freezer / hot-hold temperature records as required",
        required: true,
      },
      {
        id: "allergen_controls",
        type: "textarea",
        label: "Describe how you manage allergen information for customers",
        required: true,
        help: "e.g. Natasha’s Law labelling, matrix, staff briefings",
      },
    ],
    fire: [
      {
        id: "fra_date",
        type: "date",
        label: "Date of last fire risk assessment",
        required: true,
      },
      {
        id: "fra_competent_person",
        type: "text",
        label: "Who completed / reviewed the assessment?",
        required: true,
      },
      {
        id: "alarm_tested",
        type: "boolean",
        label: "Are fire alarms tested weekly (or per your FRA)?",
        required: true,
      },
      {
        id: "evacuation_drills",
        type: "select",
        label: "Evacuation drill frequency",
        required: true,
        options: [
          { value: "6_months", label: "At least every 6 months" },
          { value: "12_months", label: "Annually" },
          { value: "none", label: "Not yet scheduled" },
        ],
      },
    ],
    hs: [
      {
        id: "hs_policy",
        type: "boolean",
        label: "Do you have a written health & safety policy (if 5+ employees)?",
        required: true,
      },
      {
        id: "risk_assessments",
        type: "attestation",
        label: "Suitable and sufficient risk assessments are in place for our activities",
        required: true,
      },
      {
        id: "first_aider",
        type: "text",
        label: "Named first aider / appointed person",
        required: true,
      },
      {
        id: "accident_book",
        type: "boolean",
        label: "Do you maintain an accident book / RIDDOR reporting process?",
        required: true,
      },
    ],
    licence: [
      {
        id: "licence_type",
        type: "text",
        label: "Licence / registration type held",
        required: true,
        placeholder: "e.g. Premises licence, street trading, tobacco",
      },
      {
        id: "licence_number",
        type: "text",
        label: "Licence or registration number",
        required: true,
      },
      {
        id: "licence_expiry",
        type: "date",
        label: "Expiry / renewal date (if any)",
        required: false,
      },
      {
        id: "dps_name",
        type: "text",
        label: "Designated Premises Supervisor / responsible person (if applicable)",
        required: false,
      },
    ],
    employ: [
      {
        id: "staff_count",
        type: "number",
        label: "How many people do you employ?",
        required: true,
      },
      {
        id: "contracts_issued",
        type: "attestation",
        label: "Written statements of employment particulars are issued within legal timescales",
        required: true,
      },
      {
        id: "rtw_checks",
        type: "boolean",
        label: "Right-to-work checks are completed before employment starts",
        required: true,
      },
      {
        id: "payroll_provider",
        type: "text",
        label: "Payroll / PAYE arrangement",
        required: true,
        placeholder: "e.g. in-house, accountant name",
      },
    ],
    data: [
      {
        id: "data_controller",
        type: "text",
        label: "Data controller contact (name / role)",
        required: true,
      },
      {
        id: "privacy_notice",
        type: "boolean",
        label: "Is a privacy notice available to customers / staff?",
        required: true,
      },
      {
        id: "lawful_basis",
        type: "multiselect",
        label: "Main lawful bases you rely on",
        required: true,
        options: [
          { value: "contract", label: "Contract" },
          { value: "legitimate_interests", label: "Legitimate interests" },
          { value: "consent", label: "Consent" },
          { value: "legal_obligation", label: "Legal obligation" },
          { value: "vital_interests", label: "Vital interests" },
          { value: "public_task", label: "Public task" },
        ],
      },
      {
        id: "breach_process",
        type: "textarea",
        label: "How would you report a personal data breach?",
        required: true,
      },
    ],
    care: [
      {
        id: "cqc_registration",
        type: "text",
        label: "CQC / Ofsted registration number (if applicable)",
        required: false,
      },
      {
        id: "safeguarding_lead",
        type: "text",
        label: "Named safeguarding lead",
        required: true,
      },
      {
        id: "dbs_policy",
        type: "attestation",
        label: "Enhanced DBS checks are completed for eligible roles before unsupervised contact",
        required: true,
      },
      {
        id: "medication_policy",
        type: "boolean",
        label: "Is a medication / controlled drugs policy in place?",
        required: true,
      },
    ],
    construction: [
      {
        id: "cdm_role",
        type: "select",
        label: "Your typical CDM 2015 role on projects",
        required: true,
        options: [
          { value: "contractor", label: "Contractor" },
          { value: "principal_contractor", label: "Principal contractor" },
          { value: "designer", label: "Designer" },
          { value: "client", label: "Client" },
          { value: "domestic", label: "Domestic / not CDM notifiable" },
        ],
      },
      {
        id: "cscs_policy",
        type: "boolean",
        label: "Do you require appropriate competence cards (e.g. CSCS) on site?",
        required: true,
      },
      {
        id: "wah_equipment",
        type: "textarea",
        label: "Work at height controls in place",
        required: true,
        help: "Scaffold, MEWPs, harnesses, exclusion zones, training",
      },
      {
        id: "asbestos_survey",
        type: "select",
        label: "Asbestos management on pre-2000 buildings",
        required: true,
        options: [
          { value: "survey_held", label: "Survey held and shared" },
          { value: "assumed_acm", label: "ACMs assumed / managed" },
          { value: "not_applicable", label: "Not applicable" },
          { value: "gap", label: "Gap — needs action" },
        ],
      },
    ],
    property: [
      {
        id: "gas_safety",
        type: "date",
        label: "Last landlord gas safety check (CP12) date",
        required: false,
      },
      {
        id: "eicr_date",
        type: "date",
        label: "Last EICR date",
        required: false,
      },
      {
        id: "legionella",
        type: "boolean",
        label: "Is a legionella risk assessment in place where required?",
        required: true,
      },
      {
        id: "fra_commercial",
        type: "attestation",
        label: "Fire risk assessment is current for occupied commercial premises",
        required: true,
      },
    ],
  };

  const specific = byCategory[category] ?? [
    {
      id: "how_complied",
      type: "textarea",
      label: "How do you currently meet this duty?",
      required: true,
    },
    {
      id: "responsible_person",
      type: "text",
      label: "Who is responsible day-to-day?",
      required: true,
    },
    {
      id: "last_review",
      type: "date",
      label: "Date of last review / inspection",
      required: false,
    },
  ];

  return {
    title: `Requirements · ${input.title}`,
    purpose: `Ballast needs these answers and evidence to confirm this UK SME duty is understood and under control for your business.`,
    confidence: "medium",
    schema: {
      version: 1,
      fields: [...specific, ...base],
    },
  };
}

function sharedFields(input: { evidenceHint: string }): FormSchema["fields"] {
  return [
    {
      id: "evidence_available",
      type: "boolean",
      label: "Do you already hold supporting evidence for this duty?",
      required: true,
      evidenceHint: input.evidenceHint,
    },
    {
      id: "evidence_description",
      type: "textarea",
      label: "What evidence can you provide?",
      required: true,
      help: input.evidenceHint || "Policy, certificates, logs, training records",
      visibility: { fieldId: "evidence_available", equals: true },
    },
    {
      id: "evidence_gap_plan",
      type: "textarea",
      label: "What is your plan to obtain the missing evidence?",
      required: true,
      visibility: { fieldId: "evidence_available", equals: false },
    },
    {
      id: "owner_attestation",
      type: "attestation",
      label: "I confirm the information provided is accurate to the best of my knowledge",
      required: true,
    },
  ];
}
