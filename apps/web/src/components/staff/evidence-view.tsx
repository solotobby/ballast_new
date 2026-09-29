"use client";

import { IconChevronMuted, IconFile, IconImg, IconUpload } from "./icons";
import { useStaff } from "./staff-context";
import { evidenceMeta, formatWhen } from "./staff-ui";

function evidenceKind(mimeType: string) {
  return mimeType.startsWith("image/") ? "img" : "file";
}

export function EvidenceView() {
  const { siteName, evidence, openSheet, user } = useStaff();

  return (
    <div className="staff-pad-top">
      <h2 className="staff-page-title">Evidence</h2>
      <p className="staff-muted staff-tiny" style={{ marginBottom: 16 }}>
        Photos and documents you&apos;ve filed for {siteName}. Everything links to an obligation — nothing gets lost.
      </p>

      <button type="button" className="staff-btn staff-btn-teal" style={{ marginBottom: 18 }} onClick={() => openSheet({ kind: "upload" })}>
        <IconUpload /> Upload evidence
      </button>

      <div className="staff-sec-h" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 15 }}>Recent uploads</h3>
      </div>

      {evidence.length === 0 ? (
        <div className="staff-muted" style={{ textAlign: "center", padding: "40px 0" }}>
          No evidence uploaded yet.
        </div>
      ) : (
        evidence.map((item) => {
          const kind = evidenceKind(item.mimeType);
          const by = item.createdByName === user?.name ? "You" : item.createdByName;
          return (
            <div key={item.id} className="staff-ev">
              <div
                className="eic"
                style={{
                  background:
                    kind === "img"
                      ? "linear-gradient(135deg, #1f6feb, #155ac9)"
                      : "linear-gradient(135deg, #d64545, #a83232)",
                }}
              >
                {kind === "img" ? <IconImg /> : <IconFile />}
              </div>
              <div className="eb">
                <div className="en">{item.name}</div>
                <div className="em">
                  {evidenceMeta(item.obligation?.title, by, formatWhen(item.createdAt))}
                </div>
              </div>
              <IconChevronMuted />
            </div>
          );
        })
      )}
    </div>
  );
}
