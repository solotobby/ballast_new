import { IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class SaveAnswersDto {
  @IsObject()
  answers!: Record<string, unknown>;
}

export class ReviewSubmissionDto {
  @IsIn(["approved", "needs_info", "rejected"])
  status!: "approved" | "needs_info" | "rejected";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
