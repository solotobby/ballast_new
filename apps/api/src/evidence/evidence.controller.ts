import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { CreateEvidenceDto } from "./dto";
import { EvidenceService } from "./evidence.service";

@Controller("evidence")
@UseGuards(AuthGuard)
export class EvidenceController {
  constructor(@Inject(EvidenceService) private readonly evidence: EvidenceService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.evidence.list(user);
  }

  @Get(":id/file")
  async file(@CurrentUser() user: AuthUser, @Param("id") id: string, @Res() res: Response) {
    const { item, buffer } = await this.evidence.file(user, id);
    res.setHeader("Content-Type", item.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${item.name.replace(/"/g, "")}"`);
    res.send(buffer);
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
    @Body() dto: CreateEvidenceDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    if (!file) throw new BadRequestException("Attach a photo or PDF");
    return this.evidence.create(user, user.name?.trim() || user.email, dto, file);
  }
}
