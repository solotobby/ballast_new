import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { OBLIGATION_STATUSES, type ObligationStatus } from "@ballast/domain";

export class FlagObligationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateStatusDto {
  @IsIn(OBLIGATION_STATUSES.map((item) => item.id))
  status!: ObligationStatus;
}
