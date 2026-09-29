import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LogbookController } from "./logbook.controller";
import { LogbookService } from "./logbook.service";

@Module({
  imports: [AuthModule],
  controllers: [LogbookController],
  providers: [LogbookService],
})
export class LogbookModule {}
