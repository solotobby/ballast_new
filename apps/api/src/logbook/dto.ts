import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateLogDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  type!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  category!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description!: string;

  @IsString()
  siteId!: string;

  @IsOptional()
  @IsString()
  obligationId?: string;
}
