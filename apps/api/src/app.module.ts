import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { apiEnvFilePaths } from "./env-files";
import { HealthController } from "./health.controller";
import { EvidenceModule } from "./evidence/evidence.module";
import { InvitesModule } from "./invites/invites.module";
import { LogbookModule } from "./logbook/logbook.module";
import { MailModule } from "./mail/mail.module";
import { ObligationsModule } from "./obligations/obligations.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { OrganisationsModule } from "./organisations/organisations.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { SharesModule } from "./shares/shares.module";
import { StorageModule } from "./storage/storage.module";
import { TeamModule } from "./team/team.module";
import { FormsModule } from "./forms/forms.module";
import { OpsModule } from "./ops/ops.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: apiEnvFilePaths(),
    }),
    PrismaModule,
    StorageModule,
    MailModule,
    AuthModule,
    InvitesModule,
    OrganisationsModule,
    OnboardingModule,
    ObligationsModule,
    FormsModule,
    LogbookModule,
    EvidenceModule,
    SharesModule,
    TeamModule,
    ReportsModule,
    OpsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
