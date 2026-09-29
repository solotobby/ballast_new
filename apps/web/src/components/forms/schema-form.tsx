"use client";

import {
  isFieldVisible,
  type FormAnswers,
  type FormField,
  type FormSchema,
} from "@ballast/domain";
import {
  Chip,
  ChipRow,
  Control,
  Field,
  SelectControl,
  TextAreaControl,
} from "@/components/onboarding/ui";

export function SchemaForm({
  schema,
  answers,
  onChange,
  disabled,
}: {
  schema: FormSchema;
  answers: FormAnswers;
  onChange: (next: FormAnswers) => void;
  disabled?: boolean;
}) {
  function setValue(fieldId: string, value: unknown) {
    onChange({ ...answers, [fieldId]: value });
  }

  return (
    <div className="space-y-1">
      {schema.fields.map((field) => {
        if (!isFieldVisible(field, answers)) return null;
        return (
          <Field
            key={field.id}
            label={`${field.label}${field.required ? "" : " (optional)"}`}
            hint={field.help ? `· ${field.help}` : undefined}
          >
            <FieldControl
              field={field}
              value={answers[field.id]}
              disabled={disabled}
              onChange={(value) => setValue(field.id, value)}
            />
            {field.evidenceHint ? (
              <p className="mt-1.5 text-[12px] leading-snug text-ink-400">Evidence tip: {field.evidenceHint}</p>
            ) : null}
          </Field>
        );
      })}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <TextAreaControl
          disabled={disabled}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Control
          type="number"
          disabled={disabled}
          placeholder={field.placeholder}
          value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "date":
      return (
        <Control
          type="date"
          disabled={disabled}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "boolean":
    case "attestation":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white px-3.5 py-3 text-[14px]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--brand-500)]"
            disabled={disabled}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="leading-snug text-ink-700">
            {field.type === "attestation" ? "I confirm" : "Yes"}
          </span>
        </label>
      );
    case "select":
      return (
        <SelectControl
          disabled={disabled}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectControl>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <ChipRow>
          {(field.options ?? []).map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <Chip
                key={opt.value}
                active={active}
                onClick={() => {
                  if (disabled) return;
                  onChange(
                    active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value],
                  );
                }}
              >
                {opt.label}
              </Chip>
            );
          })}
        </ChipRow>
      );
    }
    case "file":
      return (
        <div className="rounded-lg border border-dashed border-line bg-canvas px-3.5 py-3 text-[13px] text-ink-500">
          Upload supporting files from the Evidence vault after submitting this questionnaire.
          {field.accept ? <span className="block mt-1 text-ink-400">Accepted: {field.accept}</span> : null}
          <Control
            className="mt-2"
            type="text"
            disabled={disabled}
            placeholder={field.placeholder ?? "Optional note about the file you will upload"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    default:
      return (
        <Control
          type="text"
          disabled={disabled}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
