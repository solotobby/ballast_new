"use client";

import { IconClock, IconUser } from "./icons";
import { useStaff } from "./staff-context";
import { BrandBadge, catEmoji, formatWhen, logBg } from "./staff-ui";

export function LogbookView() {
  const { siteName, logs, openSheet, user } = useStaff();

  return (
    <div className="staff-pad-top">
      <div className="staff-page-head">
        <h2>Logbook</h2>
        <button type="button" onClick={() => openSheet({ kind: "quick-add" })}>
          <BrandBadge>New entry</BrandBadge>
        </button>
      </div>
      <p className="staff-muted staff-tiny" style={{ marginBottom: 16 }}>
        Everything logged at {siteName}. Each entry is linked to the obligation it evidences.
      </p>

      {logs.length === 0 ? (
        <div className="staff-muted" style={{ textAlign: "center", padding: "40px 0" }}>
          No entries yet — tap + to log something on site.
        </div>
      ) : (
        <div>
          {logs.map((log) => {
            const byLabel = log.createdByName === user?.name ? "You" : log.createdByName;
            return (
              <div key={log.id} className="staff-log">
                <div className="lic" style={{ background: logBg(log.category) }}>
                  {catEmoji(log.category)}
                </div>
                <div className="lb">
                  <div className="lt">{log.type}</div>
                  <div className="ld">{log.description}</div>
                  <div className="lm">
                    <span>
                      <IconUser /> {byLabel}
                    </span>
                    <span>
                      <IconClock /> {formatWhen(log.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
