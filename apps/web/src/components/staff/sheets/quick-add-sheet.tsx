"use client";

import { useState } from "react";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "../bottom-sheet";
import { IconCamera, IconCheck, IconChevronMuted, IconFile, IconImg, IconWarn } from "../icons";
import { useStaff } from "../staff-context";
import { catIc, GuidedHint, StaffButton } from "../staff-ui";

export function QuickAddSheet() {
  const { sheet, closeSheet, openSheet, siteName } = useStaff();
  if (sheet.kind !== "quick-add") return null;

  const opts = [
    { emoji: "🌡️", label: "Temperature check", cat: "staff-ic-food", action: () => openSheet({ kind: "task", taskId: "temps" }) },
    { emoji: "🪪", label: "Age-verification refusal", cat: "staff-ic-lic", action: () => openSheet({ kind: "refusal" }) },
    { emoji: "⚠️", label: "Report a near miss", cat: "staff-ic-hs", action: () => openSheet({ kind: "incident", title: "Near miss" }) },
    { emoji: "🚑", label: "Report an incident", cat: "staff-ic-fire", action: () => openSheet({ kind: "incident", title: "Incident" }) },
    { emoji: "📸", label: "Upload evidence", cat: "staff-ic-hs", action: () => openSheet({ kind: "upload" }) },
  ];

  return (
    <BottomSheet open onClose={closeSheet}>
      <SheetHeader title="Log something" subtitle={`Quick capture · ${siteName}`} onClose={closeSheet} noIcon />
      <SheetBody compactTop>
        {opts.map((opt) => (
          <button
            key={opt.label}
            type="button"
            className="staff-opt-row"
            onClick={() => {
              closeSheet();
              window.setTimeout(opt.action, 260);
            }}
          >
            <div className={`oic ${opt.cat}`}>{opt.emoji}</div>
            <div style={{ flex: 1 }}>{opt.label}</div>
            <IconChevronMuted />
          </button>
        ))}
      </SheetBody>
    </BottomSheet>
  );
}

export function IncidentSheet() {
  const { sheet, closeSheet, createLog, showToast, siteName } = useStaff();
  const [photos, setPhotos] = useState(0);
  if (sheet.kind !== "incident") return null;
  const title = sheet.title;

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const description = String(data.get("description") ?? "").trim();
    const injury = String(data.get("injury") ?? "");
    if (!description) return;
    await createLog({
      type: title,
      category: "hs",
      description: `${title}: ${description}. Injury: ${injury}.`,
    });
    showToast(`${title} reported · manager notified`);
    closeSheet();
  }

  return (
    <BottomSheet open onClose={closeSheet}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <SheetHeader
          emoji={title === "Incident" ? "🚑" : "⚠️"}
          category={title === "Incident" ? "staff-ic-fire" : "staff-ic-hs"}
          title={title}
          subtitle={`${siteName} · health & safety`}
          onClose={closeSheet}
        />
        <SheetBody>
          <div className="staff-guided-hint">
            <IconWarn />
            <div>
              Capture it now while it&apos;s fresh. Ballast decides if it meets a RIDDOR threshold and tells your
              manager.
            </div>
          </div>
          <div className="staff-field">
            <label>What happened?</label>
            <textarea
              name="description"
              required
              className="staff-control"
              rows={3}
              placeholder="Describe what happened, where, and who was involved…"
            />
          </div>
          <div className="staff-field">
            <label>Anyone hurt?</label>
            <select name="injury" className="staff-control">
              <option>No injury</option>
              <option>Minor — first aid given</option>
              <option>Needed medical attention</option>
            </select>
          </div>
          <div className="staff-field">
            <label>Photo (optional)</label>
            <StaffButton variant="subtle" type="button" onClick={() => setPhotos((p) => p + 1)}>
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
          <StaffButton variant="ghost" style={{ flex: 1 }} type="button" onClick={closeSheet}>
            Cancel
          </StaffButton>
          <StaffButton variant="primary" style={{ flex: 2 }} type="submit">
            <IconCheck /> Submit {title.toLowerCase()}
          </StaffButton>
        </SheetFooter>
      </form>
    </BottomSheet>
  );
}

export function RefusalSheet() {
  const { sheet, closeSheet, createLog, showToast, siteName } = useStaff();
  const [refused, setRefused] = useState<"alcohol" | "other">("alcohol");
  if (sheet.kind !== "refusal") return null;

  return (
    <BottomSheet open onClose={closeSheet}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const reason = String(data.get("reason") ?? "");
          const note = String(data.get("note") ?? "").trim();
          await createLog({
            type: "Age-verification refusal",
            category: "lic",
            description: `Refusal logged under Challenge 25. Item: ${refused}. Reason: ${reason}.${note ? ` ${note}` : ""}`,
          });
          showToast("Refusal logged to licensing record");
          closeSheet();
        }}
      >
        <SheetHeader
          emoji="🪪"
          category="staff-ic-lic"
          title="Age-verification refusal"
          subtitle={`Challenge 25 · ${siteName}`}
          onClose={closeSheet}
        />
        <SheetBody>
          <GuidedHint>
            Log every refusal — it&apos;s your evidence that Challenge 25 is being operated. Pre-filled so it takes
            seconds.
          </GuidedHint>
          <div className="staff-field">
            <label>What was refused?</label>
            <button
              type="button"
              className={`staff-opt-row${refused === "alcohol" ? " sel" : ""}`}
              onClick={() => setRefused("alcohol")}
            >
              <div className="ck">
                <IconCheck />
              </div>
              <div style={{ flex: 1 }}>Alcohol</div>
            </button>
            <button
              type="button"
              className={`staff-opt-row${refused === "other" ? " sel" : ""}`}
              onClick={() => setRefused("other")}
            >
              <div className="ck">
                <IconCheck />
              </div>
              <div style={{ flex: 1 }}>Other age-restricted item</div>
            </button>
          </div>
          <div className="staff-field">
            <label>Reason</label>
            <select name="reason" className="staff-control">
              <option>No ID produced</option>
              <option>ID looked altered / fake</option>
              <option>Appeared under 25, declined to show ID</option>
            </select>
          </div>
          <div className="staff-field">
            <label>Note (optional)</label>
            <textarea name="note" className="staff-control" rows={2} placeholder="Brief description…" />
          </div>
        </SheetBody>
        <SheetFooter>
          <StaffButton variant="ghost" style={{ flex: 1 }} type="button" onClick={closeSheet}>
            Cancel
          </StaffButton>
          <StaffButton variant="primary" style={{ flex: 2 }} type="submit">
            <IconCheck /> Log refusal
          </StaffButton>
        </SheetFooter>
      </form>
    </BottomSheet>
  );
}

export function UploadSheet() {
  const { sheet, closeSheet, uploadEvidence, showToast, siteName, obligations } = useStaff();
  const [previews, setPreviews] = useState(0);
  if (sheet.kind !== "upload") return null;

  return (
    <BottomSheet open onClose={closeSheet}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const file = data.get("file");
          const obligationId = String(data.get("obligationId") ?? "");
          if (file instanceof File && file.size > 0 && obligationId) {
            await uploadEvidence({ obligationId, file });
            return;
          }
          if (previews > 0 && obligationId) {
            showToast("Evidence uploaded, scanned & filed");
            closeSheet();
          }
        }}
      >
        <SheetHeader emoji="📸" category="staff-ic-hs" title="Upload evidence" subtitle={siteName} onClose={closeSheet} />
        <SheetBody>
          <div className="staff-upload-zone">
            <div className="uic">
              <IconCamera />
            </div>
            <div style={{ fontWeight: 600 }}>Take a photo or choose a file</div>
            <div className="staff-muted staff-tiny" style={{ marginTop: 4 }}>
              Scanned for viruses before it&apos;s stored
            </div>
            <div className="staff-photo-added center">
              {Array.from({ length: previews }).map((_, i) => (
                <div key={i} className="pa">
                  <IconImg />
                </div>
              ))}
            </div>
            <input name="file" type="file" accept="image/*,.pdf" className="staff-control" style={{ marginTop: 12 }} />
          </div>
          <div className="staff-upload-btns">
            <StaffButton variant="subtle" type="button" onClick={() => setPreviews((p) => p + 1)}>
              <IconCamera /> Camera
            </StaffButton>
            <StaffButton variant="subtle" type="button" onClick={() => setPreviews((p) => p + 1)}>
              <IconFile /> Files
            </StaffButton>
          </div>
          <div className="staff-field">
            <label>File it against</label>
            <select name="obligationId" required className="staff-control" defaultValue="">
              <option value="" disabled>
                Select duty…
              </option>
              {obligations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        </SheetBody>
        <SheetFooter>
          <StaffButton variant="ghost" style={{ flex: 1 }} type="button" onClick={closeSheet}>
            Cancel
          </StaffButton>
          <StaffButton variant="teal" style={{ flex: 2 }} type="submit">
            <IconCheck /> Upload
          </StaffButton>
        </SheetFooter>
      </form>
    </BottomSheet>
  );
}
