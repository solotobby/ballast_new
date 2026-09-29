import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      ok: true,
      service: "ballast-api",
      docs: "This is the JSON API. Use the web app at http://localhost:3000",
      routes: {
        health: "GET /health",
        signUp: "POST /auth/sign-up",
        signIn: "POST /auth/sign-in",
        me: "GET /auth/me",
        organisation: "GET /organisations/me",
        obligations: "GET /obligations",
      },
    };
  }

  @Get("health")
  health() {
    return { ok: true, service: "ballast-api" };
  }
}
