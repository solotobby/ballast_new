import { describe, expect, it } from "vitest";
import type { BusinessProfile } from "@ballast/domain";
import { generateObligationSet } from "./generate-obligation-set";

const copperKettle: BusinessProfile = {
  sector: "hospitality",
  sizeBand: "2_10",
  siteCount: 2,
  activities: ["Food preparation", "Alcohol sales", "Seating / dine-in", "Employs staff", "Handles card payments"],
};

describe("generateObligationSet — hospitality", () => {
  it("returns the Copper Kettle hospitality set", () => {
    const { pack, obligations } = generateObligationSet(copperKettle);
    expect(pack.version).toBe("v2026.3");
    expect(obligations.map((o) => o.id)).toEqual([
      "FSA-01",
      "FSA-02",
      "FSA-03",
      "FIR-01",
      "FIR-02",
      "FIR-03",
      "HS-01",
      "HS-02",
      "HS-03",
      "LIC-01",
      "LIC-02",
      "EMP-01",
      "EMP-02",
      "DAT-01",
    ]);
  });

  it("omits alcohol and employment duties when they do not apply", () => {
    const { obligations } = generateObligationSet({
      sector: "hospitality",
      sizeBand: "just_me",
      siteCount: 1,
      activities: ["Food preparation"],
    });
    const ids = obligations.map((o) => o.id);
    expect(ids).toContain("FSA-01");
    expect(ids).toContain("FIR-01");
    expect(ids).not.toContain("FIR-03");
    expect(ids).not.toContain("LIC-01");
    expect(ids).not.toContain("HS-01");
    expect(ids).not.toContain("DAT-01");
  });

  it("matches AI-worded activity chips against the pack", () => {
    const { obligations } = generateObligationSet({
      ...copperKettle,
      activities: ["Food preparation / cooking", "Alcohol sales", "Employs staff", "Handles card payments"],
    });
    expect(obligations.map((o) => o.id)).toContain("FSA-01");
    expect(obligations.map((o) => o.id)).toContain("LIC-01");
  });

  it("returns no pack for sectors we have not authored yet", () => {
    const { obligations } = generateObligationSet({
      sector: "construction",
      sizeBand: "2_10",
      siteCount: 1,
      activities: ["Employs staff"],
    });
    expect(obligations).toEqual([]);
  });
});
