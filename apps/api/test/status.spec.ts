import { describe, expect, it } from "vitest";
import { deriveObligationStatus } from "@ballast/domain";

describe("deriveObligationStatus", () => {
  it("is an evidence gap until something is logged", () => {
    expect(deriveObligationStatus("Recurring · daily", null).status).toBe("evidence_gap");
  });

  it("is on track the same day a daily check is logged", () => {
    const now = new Date("2026-08-23T12:00:00Z");
    const logged = new Date("2026-08-23T08:00:00Z");
    expect(deriveObligationStatus("Recurring · daily", logged, now).status).toBe("on_track");
  });

  it("is overdue when the cadence window has passed", () => {
    const now = new Date("2026-08-23T12:00:00Z");
    const logged = new Date("2026-08-21T08:00:00Z");
    expect(deriveObligationStatus("Recurring · daily", logged, now).status).toBe("overdue");
  });
});
