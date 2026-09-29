import { IsOptional, IsString, MinLength } from "class-validator";

export class OpsSignInDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}

export class OpsFlagActionDto {
  @IsString()
  action!: "uphold" | "reject";
}

export class TriggerCrawlDto {
  @IsString()
  code!: string;
}

export class CreateRegulatorySourceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  portalUrl!: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  sector?: string;
}

export class UpdateRegulatorySourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  portalUrl?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  status?: string; // "active" | "inactive"
}

export class ValidateUrlDto {
  @IsString()
  url!: string;
}



