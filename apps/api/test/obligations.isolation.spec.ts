import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ObligationsService } from "../src/obligations/obligations.service";

describe("ObligationsService tenant isolation", () => {
  it("looks up an obligation by id AND organisationId", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = new ObligationsService(
      {
        organisationObligation: { findFirst },
      } as never,
      {} as never,
    );

    await expect(service.getOne("org_kettle", "ob_foreign")).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "ob_foreign", organisationId: "org_kettle" },
    });
  });

  it("will not confirm an obligation that belongs to another organisation", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new ObligationsService(
      {
        organisationObligation: { updateMany },
      } as never,
      {} as never,
    );

    await expect(service.confirm("org_kettle", "ob_foreign")).rejects.toBeInstanceOf(NotFoundException);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "ob_foreign", organisationId: "org_kettle" },
      data: { reviewState: "confirmed", flagReason: null },
    });
  });
});
