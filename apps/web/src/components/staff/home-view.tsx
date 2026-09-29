"use client";

import Link from "next/link";
import { TaskCard } from "./task-card";
import { ProgressRing } from "./progress-ring";
import { IconBell, IconLoc, IconSpark } from "./icons";
import { useStaff } from "./staff-context";
import { initials } from "@/lib/user";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const { user, org, siteName, tasks, openSheet } = useStaff();
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const active = tasks.filter((t) => t.status !== "done");
  const nextDue = tasks.find((t) => t.status === "due");
  const completed = tasks.filter((t) => t.status === "done");
  const firstName = user?.name?.split(" ")[0] ?? "Tomas";

  return (
    <>
      <div className="staff-home-head">
        <div className="staff-hh-top">
          <div className="who">
            <div className="hi">{greeting()}</div>
            <div className="nm">{firstName} 👋</div>
            <div className="staff-hh-site">
              <IconLoc />
              {org?.name ?? "The Copper Kettle"} · {siteName}
            </div>
          </div>
          <button type="button" className="staff-hh-bell" aria-label="Notifications">
            <IconBell />
            <span className="staff-hh-bell-dot" />
          </button>
          <div className="staff-hh-av">{user ? initials(user.name, user.email) : "TN"}</div>
        </div>
      </div>

      <div className="staff-ring-card">
        <ProgressRing done={done} total={total} />
        <div className="rc-txt">
          <h3>{done === total ? "All done for now 🎉" : `${total - done} checks to go`}</h3>
          <p>
            {nextDue ? (
              <>
                Next up: <b>{nextDue.name}</b>
              </>
            ) : (
              <>You&apos;re on top of today&apos;s checks at {siteName}.</>
            )}
          </p>
        </div>
      </div>

      <div className="staff-pad">
        <div className="staff-help-banner">
          <div className="sp">
            <IconSpark />
          </div>
          <div className="t">
            <b>Heads-up from your manager.</b> Chilled deliveries keep arriving warm — please{" "}
            <b>check dairy temperature on arrival today</b> and reject anything above 8°C.
          </div>
        </div>

        <div className="staff-sec-h">
          <h3>Today&apos;s checks</h3>
          <Link href="/staff/tasks" className="link">
            All tasks
          </Link>
        </div>
        {active.slice(0, 4).map((task) => (
          <TaskCard key={task.id} task={task} onOpen={() => openSheet({ kind: "task", taskId: task.id })} />
        ))}

        {completed.length > 0 ? (
          <>
            <div className="staff-sec-h">
              <h3 className="staff-muted" style={{ fontSize: 14 }}>
                Completed
              </h3>
            </div>
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={() => openSheet({ kind: "task", taskId: task.id })} />
            ))}
          </>
        ) : null}
      </div>
    </>
  );
}
