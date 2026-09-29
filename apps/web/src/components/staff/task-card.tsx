"use client";

import { IconCheck, IconChevron } from "./icons";
import { catEmoji, catIc, statusBadge } from "./staff-ui";
import type { StaffTask } from "./types";

export function TaskCard({ task, onOpen }: { task: StaffTask; onOpen: () => void }) {
  const done = task.status === "done";
  return (
    <button type="button" onClick={onOpen} className={`staff-task${done ? " done" : ""}`}>
      <div className={`tic ${catIc(task.category)}`}>{catEmoji(task.category)}</div>
      <div className="tt">
        <div className="nm">{task.name}</div>
        <div className="mt">
          {statusBadge(task.status)}
          <span>{task.meta}</span>
        </div>
      </div>
      <div className="go">{done ? <IconCheck /> : <IconChevron />}</div>
    </button>
  );
}
