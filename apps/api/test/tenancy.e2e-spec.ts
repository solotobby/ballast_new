import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("tenant isolation", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not let organisation A read organisation B's obligation", async () => {
    const suffix = Date.now();
    const a = await request(app.getHttpServer())
      .post("/auth/sign-up")
      .send({
        businessName: `Cafe A ${suffix}`,
        email: `a-${suffix}@ballast.test`,
        password: "password1",
      })
      .expect(201);

    const b = await request(app.getHttpServer())
      .post("/auth/sign-up")
      .send({
        businessName: `Cafe B ${suffix}`,
        email: `b-${suffix}@ballast.test`,
        password: "password1",
      })
      .expect(201);

    const cookieA = a.headers["set-cookie"]?.[0];
    const cookieB = b.headers["set-cookie"]?.[0];
    expect(cookieA).toBeTruthy();
    expect(cookieB).toBeTruthy();

    await request(app.getHttpServer())
      .patch("/organisations/me/profile")
      .set("Cookie", cookieA)
      .send({
        sector: "hospitality",
        sizeBand: "2_10",
        siteCount: 2,
        activities: ["Food preparation", "Alcohol sales", "Employs staff", "Handles card payments"],
      })
      .expect(200);

    const generated = await request(app.getHttpServer())
      .post("/obligations/generate")
      .set("Cookie", cookieA)
      .expect(201);

    const foreignId = generated.body.obligations[0].id as string;

    await request(app.getHttpServer()).get(`/obligations/${foreignId}`).set("Cookie", cookieB).expect(404);

    await request(app.getHttpServer()).post(`/obligations/${foreignId}/confirm`).set("Cookie", cookieB).expect(404);

    const stillA = await prisma.organisationObligation.findFirst({
      where: { id: foreignId, organisationId: a.body.user.organisationId },
    });
    expect(stillA?.reviewState).toBe("pending");
  }, 30000);
});
