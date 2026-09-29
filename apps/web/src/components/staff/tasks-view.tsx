"use client";

import { TaskCard } from "./task-card";
import { useStaff } from "./staff-context";
import { BrandBadge } from "./staff-ui";

export function TasksView() {
  const { siteName, tasks, taskFilter, setTaskFilter, openSheet } = useStaff();

  let list = tasks;
  if (taskFilter === "done") list = tasks.filter((t) => t.status === "done");
  else if (taskFilter === "today") list = tasks.filter((t) => t.status !== "done");

  return (
    <div className="staff-pad-top">
      <div className="staff-page-head">
        <h2>Tasks</h2>
        <BrandBadge>{siteName} only</BrandBadge>
      </div>
      <p className="staff-muted staff-tiny" style={{ marginBottom: 14 }}>
        Your assigned checks for this site. Recurring items reappear automatically.
      </p>

      <div className="staff-seg">
        {(
          [
            ["today", "Today"],
            ["recurring", "Recurring"],
            ["done", "Done"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={taskFilter === key ? "active" : ""}
            onClick={() => setTaskFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="staff-muted" style={{ textAlign: "center", padding: "40px 0" }}>
          Nothing here.
        </div>
      ) : (
        list.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={() => openSheet({ kind: "task", taskId: task.id })} />
        ))
      )}
    </div>
  );
}
