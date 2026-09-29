import { describe, expect, it, vi } from "vitest";
import { AiService } from "../src/ai/ai.service";
import { ObligationsService } from "../src/obligations/obligations.service";

describe("Dynamic Activities and Obligations Engine", () => {
  it("suggestActivitiesForProfile separates activities into core statutory baseline and site-tailored generated groups", async () => {
    const prisma = {
      regulatorySource: {
        findMany: vi.fn().mockResolvedValue([
          { code: "fsa", name: "Food Standards Agency", sector: "hospitality" },
          { code: "hse_catering", name: "HSE Catering Safety", sector: "hospitality" },
        ]),
      },
    };
    const config = {
      get: vi.fn().mockReturnValue(""), // No OpenAI key, test resilient fallback synthesis
    };

    const aiService = new AiService(config as never, prisma as never);

    const result = await aiService.suggestActivitiesForProfile({
      sector: "hospitality",
      businessName: "The Copper Kettle",
      council: "Camden Council",
      sites: [
        {
          name: "Main Restaurant & Bar",
          postcode: "NW1 8NH",
          premisesType: "Commercial kitchen with gas combi oven, deep fryer, and licensed bar serving alcohol",
        },
      ],
    });

    expect(result.coreActivities.length).toBeGreaterThan(0);
    expect(result.generatedActivities.length).toBeGreaterThan(0);

    // Verify core activities are marked as "core"
    for (const act of result.coreActivities) {
      expect(act.group).toBe("core");
    }

    // Verify generated activities are marked as "generated" and match the premises
    for (const act of result.generatedActivities) {
      expect(act.group).toBe("generated");
    }

    // Check specific equipment / license matches
    const hasAlcoholOrGasOrKitchen = result.generatedActivities.some(
      (a) =>
        a.name.toLowerCase().includes("alcohol") ||
        a.name.toLowerCase().includes("gas") ||
        a.name.toLowerCase().includes("kitchen") ||
        a.name.toLowerCase().includes("cook"),
    );
    expect(hasAlcoholOrGasOrKitchen).toBe(true);
  });

  it("obligationsForProfile synthesizes tailored duties for custom and generated activities with local council citation", async () => {
    const prisma = {
      regulatorySource: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const config = {
      get: vi.fn().mockReturnValue(""),
    };

    const aiService = new AiService(config as never, prisma as never);

    const result = await aiService.obligationsForProfile({
      organisationName: "The Copper Kettle",
      sector: "hospitality",
      council: "Camden Council",
      sizeBand: "micro_1_9",
      siteCount: 1,
      sites: [
        {
          name: "Main Dining",
          postcode: "NW1 8NH",
          description: "Dining room and licensed bar serving draft beer and spirits",
        },
      ],
      activities: [
        "act_hosp_alcohol",
        "act_custom_deep_fryer_maintenance",
      ],
    });

    expect(result.obligations.length).toBeGreaterThanOrEqual(2);

    // Verify dynamic why mentions Camden Council or premises
    const councilOrPremisesMentioned = result.obligations.some((o) =>
      (o.why && o.why.includes("Camden Council")) || (o.why && o.why.includes("Main Dining")),
    );
    expect(councilOrPremisesMentioned).toBe(true);

    // Verify statutory grounding
    const hasBasis = result.obligations.every((o) => !!o.basis);
    expect(hasBasis).toBe(true);
  });

  it("ObligationsService.persist purges old confirmed obligations when regenerating", async () => {
    const deletedWhereArgs: unknown[] = [];
    const prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => {
        const tx = {
          obligationDefinition: {
            upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: "def_1", ...create })),
          },
          organisationObligation: {
            deleteMany: vi.fn().mockImplementation((args) => {
              deletedWhereArgs.push(args);
              return Promise.resolve({ count: 5 });
            }),
            upsert: vi.fn().mockResolvedValue({ id: "org_ob_1" }),
          },
        };
        return cb(tx);
      }),
    };

    const aiService = {
      obligationsForProfile: vi.fn(),
    };

    const service = new ObligationsService(prisma as never, aiService as never);

    await service.persist("org_1", [
      {
        id: "gen_ob_1",
        title: "Premises Licence Operating Schedule",
        category: "licensing",
        cadence: "annual",
        scope: "site",
        legalBasis: "Licensing Act 2003",
        statutoryDuty: "Mandatory conditions compliance",
        regulatoryAuthority: "Licensing Authority (Camden Council)",
        recommendedProof: "DPS register",
        sourcePhrase: "CRAWL_MATCH",
        aiWhy: "Required for Main Dining",
      },
    ]);

    expect(deletedWhereArgs.length).toBe(1);
    const deleteCall = deletedWhereArgs[0] as { where: Record<string, unknown> };
    expect(deleteCall.where.organisationId).toBe("org_1");
    // CRITICAL: Must not be constrained to reviewState: 'pending', so confirmed obligations from previous runs are refreshed!
    expect(deleteCall.where.reviewState).toBeUndefined();
  });
});
