import { IsOptional, IsString } from "class-validator";

export class CreateEvidenceDto {
  @IsString()
  obligationId!: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
