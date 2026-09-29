import { Body, Controller, Get, Inject, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { CreateLogDto } from "./dto";
import { LogbookService } from "./logbook.service";

@Controller("logbook")
@UseGuards(AuthGuard)
export class LogbookController {
  constructor(@Inject(LogbookService) private readonly logbook: LogbookService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.logbook.list(user);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLogDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    const createdByName = user.name?.trim() || user.email;
    return this.logbook.create(user, createdByName, dto, file);
  }
}
