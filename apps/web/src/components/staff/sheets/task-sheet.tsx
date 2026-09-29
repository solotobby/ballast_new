"use client";

import { useEffect, useState } from "react";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "../bottom-sheet";
import { IconCamera, IconCheck, IconImg } from "../icons";
import { useStaff } from "../staff-context";
import { catEmoji, catIc, GuidedHint, StaffButton } from "../staff-ui";
import type { StaffTask } from "../types";

function TempsSheet({ task, onClose }: { task: StaffTask; onClose: () => void }) {
  const { completeTask, siteName } = useStaff();
  const units = [
    { name: "Walk-in chiller", target: "0–5°C target", lo: 0, hi: 5, value: 3 },
    { name: "Under-counter fridge", target: "0–5°C target", lo: 0, hi: 5, value: 4 },
    { name: "Display chiller", target: "0–8°C target", lo: 0, hi: 8, value: 5 },
    { name: "Freezer", target: "−18°C or below", lo: -30, hi: -18, value: -19 },
  ];
  const [readings, setReadings] = useState(units.map((u) => u.value));
  const [photos, setPhotos] = useState(0);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const summary = units.map((u, i) => `${u.name.split(" ")[0]} ${readings[i]}°C`).join(" · ");
      await completeTask(task.id, `${task.name}: ${summary}. All readings logged on site.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SheetHeader
        emoji={catEmoji(task.category)}
        category={catIc(task.category)}
        title={task.name}
        subtitle={`${siteName} · ${task.meta}`}
        onClose={onClose}
      />
      <SheetBody>
        <GuidedHint>
          Tap + / − to enter each reading. Ballast flags anything out of range as you go — no need to remember the
          limits.
        </GuidedHint>
        {units.map((unit, i) => {
          const ok = readings[i]! >= unit.lo && readings[i]! <= unit.hi;
          return (
            <div key={unit.name} className="staff-temp-row">
              <div className="tn">
                {unit.name}
                <small>{unit.target}</small>
              </div>
              <span className="staff-rangeflag" style={{ background: ok ? "var(--ok-500)" : "var(--over-500)" }} />
              <div className="staff-stepper">
                <button type="button" onClick={() => setReadings((r) => r.map((v, j) => (j === i ? v - 1 : v)))}>
                  −
                </button>
                <div className="v">{readings[i]}°</div>
                <button type="button" onClick={() => setReadings((r) => r.map((v, j) => (j === i ? v + 1 : v)))}>
                  +
                </button>
              </div>
            </div>
          );
        })}
        <div className="staff-field" style={{ marginTop: 16 }}>
          <label>Add a photo (optional)</label>
          <StaffButton variant="subtle" onClick={() => setPhotos((p) => p + 1)}>
            <IconCamera /> Snap the probe reading
          </StaffButton>
          {photos > 0 ? (
            <div className="staff-photo-added">
              {Array.from({ length: photos }).map((_, i) => (
                <div key={i} className="pa">
                  <IconImg />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SheetBody>
      <SheetFooter>
        <StaffButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </StaffButton>
        <StaffButton variant="primary" style={{ flex: 2 }} disabled={pending} onClick={submit}>
          <IconCheck /> {pending ? "Saving…" : "Submit reading"}
        </StaffButton>
      </SheetFooter>
    </>
  );
}

function ConfirmSheet({ task, onClose }: { task: StaffTask; onClose: () => void }) {
  const { completeTask, siteName } = useStaff();
  const [selected, setSelected] = useState<"ok" | "issue">("ok");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const status = selected === "ok" ? "confirmed" : "needs attention";
      await completeTask(
        task.id,
        `${task.name} ${status} on site.${note ? ` Note: ${note}` : ""}`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SheetHeader
        emoji={catEmoji(task.category)}
        category={catIc(task.category)}
        title={task.name}
        subtitle={`${siteName} · ${task.meta}`}
        onClose={onClose}
      />
      <SheetBody>
        <GuidedHint>
          A quick one — just confirm what you see right now. If something&apos;s off, flag it and it goes straight to
          your manager.
        </GuidedHint>
        <button
          type="button"
          className={`staff-opt-row${selected === "ok" ? " sel" : ""}`}
          onClick={() => setSelected("ok")}
        >
          <div className="oic staff-ic-food">✅</div>
          <div style={{ flex: 1 }}>All good — {task.name.toLowerCase()}</div>
          <div className="ck">
            <IconCheck />
          </div>
        </button>
        <button
          type="button"
          className={`staff-opt-row${selected === "issue" ? " sel" : ""}`}
          onClick={() => setSelected("issue")}
        >
          <div className="oic staff-ic-fire">⚠️</div>
          <div style={{ flex: 1 }}>Needs attention</div>
          <div className="ck">
            <IconCheck />
          </div>
        </button>
        <div className="staff-field" style={{ marginTop: 14 }}>
          <label>Note (optional)</label>
          <textarea
            className="staff-control"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to add for your manager?"
          />
        </div>
      </SheetBody>
      <SheetFooter>
        <StaffButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </StaffButton>
        <StaffButton variant="primary" style={{ flex: 2 }} disabled={pending} onClick={submit}>
          <IconCheck /> {pending ? "Saving…" : "Log check"}
        </StaffButton>
      </SheetFooter>
    </>
  );
}

function ChecklistSheet({ task, onClose }: { task: StaffTask; onClose: () => void }) {
  const { completeTask, siteName } = useStaff();
  const items =
    task.category === "fire"
      ? [
          "Fire exits clear & unlocked",
          "Extinguishers in place & sealed",
          "Fire door not propped open",
          "Signage visible & lit",
        ]
      : [
          "Surfaces cleaned & sanitised",
          "Handwash stocked (soap + towels)",
          "Probe thermometer checked",
          "Allergen matrix on display",
          "Waste removed",
        ];
  const [selected, setSelected] = useState(() => new Set([items[0]!]));
  const [photos, setPhotos] = useState(0);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const done = items.filter((i) => selected.has(i)).join("; ");
      await completeTask(task.id, `${task.name}: ${done}.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SheetHeader
        emoji={catEmoji(task.category)}
        category={catIc(task.category)}
        title={task.name}
        subtitle={`${siteName} · ${task.meta}`}
        onClose={onClose}
      />
      <SheetBody>
        <GuidedHint>
          Work down the list and tap each item as you check it. Add a photo for anything you want on record.
        </GuidedHint>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`staff-opt-row${selected.has(item) ? " sel" : ""}`}
            onClick={() =>
              setSelected((current) => {
                const next = new Set(current);
                if (next.has(item)) next.delete(item);
                else next.add(item);
                return next;
              })
            }
          >
            <div className="ck">
              <IconCheck />
            </div>
            <div style={{ flex: 1 }}>{item}</div>
          </button>
        ))}
        <div className="staff-field" style={{ marginTop: 6 }}>
          <label>Add a photo (optional)</label>
          <StaffButton variant="subtle" onClick={() => setPhotos((p) => p + 1)}>
            <IconCamera /> Add photo
          </StaffButton>
          {photos > 0 ? (
            <div className="staff-photo-added">
              {Array.from({ length: photos }).map((_, i) => (
                <div key={i} className="pa">
                  <IconImg />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SheetBody>
      <SheetFooter>
        <StaffButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </StaffButton>
        <StaffButton variant="primary" style={{ flex: 2 }} disabled={pending} onClick={submit}>
          <IconCheck /> {pending ? "Saving…" : "Complete"}
        </StaffButton>
      </SheetFooter>
    </>
  );
}

export function TaskSheet() {
  const { sheet, tasks, closeSheet, showToast } = useStaff();
  const task = sheet.kind === "task" ? tasks.find((t) => t.id === sheet.taskId) : null;

  useEffect(() => {
    if (sheet.kind !== "task" || !task) return;
    if (task.status === "done") {
      showToast("Already logged — nice work");
      closeSheet();
    }
  }, [sheet, task, showToast, closeSheet]);

  if (sheet.kind !== "task") return null;
  if (!task || task.status === "done") return null;

  return (
    <BottomSheet open onClose={closeSheet}>
      {task.type === "temps" ? (
        <TempsSheet task={task} onClose={closeSheet} />
      ) : task.type === "confirm" ? (
        <ConfirmSheet task={task} onClose={closeSheet} />
      ) : (
        <ChecklistSheet task={task} onClose={closeSheet} />
      )}
    </BottomSheet>
  );
}
