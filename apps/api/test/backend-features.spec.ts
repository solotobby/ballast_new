import { describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";
import { OrganisationsService } from "../src/organisations/organisations.service";
import { OpsService } from "../src/ops/ops.service";
import { createHash } from "node:crypto";

describe("AuthService password reset flow", () => {
  it("generates a hashed token and sends an email on forgotPassword", async () => {
    const user = { id: "usr_1", email: "elena@copperkettle.co.uk" };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
      },
      passwordResetToken: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: "rst_1" }),
      },
    };
    const mail = {
      sendPasswordReset: vi.fn().mockResolvedValue({ id: "email_1" }),
    };
    const config = {
      get: vi.fn().mockReturnValue("https://app.ballast.app"),
    };

    const service = new AuthService(
      prisma as never,
      {} as never,
      mail as never,
      config as never,
    );

    const result = await service.forgotPassword({ email: "elena@copperkettle.co.uk" });
    expect(result.ok).toBe(true);
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "usr_1", usedAt: null },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(mail.sendPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "elena@copperkettle.co.uk",
        resetUrl: expect.stringContaining("https://app.ballast.app/reset-password?token="),
      }),
    );
  });

  it("handles non-existent user on forgotPassword without leaking existence", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      passwordResetToken: { create: vi.fn() },
    };
    const mail = { sendPasswordReset: vi.fn() };
    const service = new AuthService(
      prisma as never,
      {} as never,
      mail as never,
      { get: () => "http://localhost:3000" } as never,
    );

    const result = await service.forgotPassword({ email: "unknown@example.com" });
    expect(result.ok).toBe(true);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("rejects resetPassword with invalid or expired token", async () => {
    const prisma = {
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.resetPassword({ token: "expired-or-bad-token", password: "newStrongPassword123" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("successfully updates password and marks token used on valid resetPassword", async () => {
    const rawToken = "valid-token-1234567890";
    const hashed = createHash("sha256").update(rawToken).digest("hex");
    const resetRecord = {
      id: "rst_valid",
      userId: "usr_1",
      tokenHash: hashed,
      user: { id: "usr_1", email: "elena@copperkettle.co.uk" },
    };

    const prisma = {
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(resetRecord),
        update: vi.fn().mockResolvedValue({ id: "rst_valid" }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: "usr_1" }),
      },
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback(prisma);
      }),
    };

    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.resetPassword({ token: rawToken, password: "newSecurePassword456!" });
    expect(result.ok).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "usr_1" },
        data: expect.objectContaining({ passwordHash: expect.any(String) }),
      }),
    );
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rst_valid" },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
  });
});

describe("OrganisationsService updates and multi-site", () => {
  it("updates business profile with Companies House registration details", async () => {
    const prisma = {
      organisation: {
        update: vi.fn().mockResolvedValue({ id: "org_1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "org_1",
          name: "The Copper Kettle",
          legalName: "The Copper Kettle Ltd",
          companyNumber: "08492019",
          sicCode: "56101",
          address: "14 High Street, Winchester, SO23 9JX",
          jurisdiction: "England & Wales",
          council: "Winchester City Council",
          sector: "hospitality",
          sizeBand: "2_10",
          siteCount: 1,
          activities: ["dine_in", "prep_food"],
          extraNotes: null,
          onboardingStep: "done",
          sites: [{ id: "site_1", name: "Main site", address: "14 High Street", kind: "restaurant", postcode: "SO23 9JX", staffCount: 8 }],
          invites: [],
        }),
      },
      site: {
        findMany: vi.fn().mockResolvedValue([{ id: "site_1" }]),
        createMany: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (cb: any) => cb(prisma)),
    };

    const service = new OrganisationsService(prisma as never, {} as never);
    const result = await service.updateProfile("org_1", {
      sector: "hospitality",
      sizeBand: "2_10",
      siteCount: 1,
      legalName: "The Copper Kettle Ltd",
      companyNumber: "08492019",
      sicCode: "56101",
      address: "14 High Street, Winchester, SO23 9JX",
      council: "Winchester City Council",
      jurisdiction: "England & Wales",
    });

    expect(result.companyNumber).toBe("08492019");
    expect(result.sicCode).toBe("56101");
    expect(result.council).toBe("Winchester City Council");
    expect(result.sites[0].staffCount).toBe(8);
  });

  it("updates site-specific parameters like postcode and staff count", async () => {
    const existingSite = { id: "site_1", organisationId: "org_1", name: "Main site" };
    const prisma = {
      site: {
        findFirst: vi.fn().mockResolvedValue(existingSite),
        update: vi.fn().mockResolvedValue({
          ...existingSite,
          postcode: "SO23 9JX",
          staffCount: 12,
          description: "Flagship historic tea room",
        }),
      },
    };

    const service = new OrganisationsService(prisma as never, {} as never);
    const updated = await service.updateSite("org_1", "site_1", {
      postcode: "SO23 9JX",
      staffCount: 12,
      description: "Flagship historic tea room",
    });

    expect(updated.postcode).toBe("SO23 9JX");
    expect(updated.staffCount).toBe(12);
  });
});

describe("OpsService regulatory scrapers and audit logging", () => {
  it("seeds scrapers and triggers crawl with audit log", async () => {
    const mockSource = {
      id: "src_fsa",
      name: "Food Standards Agency (FSA)",
      code: "fsa",
      portalUrl: "https://food.gov.uk",
      frequency: "daily",
      sector: "hospitality",
      status: "active",
      rulesCount: 28,
      lastCrawlAt: null,
    };

    const prisma = {
      regulatorySource: {
        count: vi.fn().mockResolvedValue(1),
        upsert: vi.fn().mockResolvedValue(mockSource),
        findUnique: vi.fn().mockResolvedValue(mockSource),
        update: vi.fn().mockResolvedValue({ ...mockSource, rulesCount: 29 }),
        findMany: vi.fn().mockResolvedValue([mockSource]),
      },
      scraperCrawl: {
        count: vi.fn().mockResolvedValue(5),
        create: vi.fn().mockResolvedValue({ id: "crw_1", status: "success" }),
      },
      opsAuditLog: {
        create: vi.fn().mockResolvedValue({ id: "aud_1" }),
      },
    };

    const service = new OpsService(prisma as never);
    const crawlResult = await service.triggerCrawl("fsa", "ops-lead@ballast.app");

    expect(crawlResult.ok).toBe(true);
    expect(prisma.scraperCrawl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceId: "src_fsa",
          status: "success",
        }),
      }),
    );
    expect(prisma.opsAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorEmail: "ops-lead@ballast.app",
          action: "crawl_completed",
          targetType: "regulatory_source",
          targetId: "fsa",
        }),
      }),
    );
  });
});
