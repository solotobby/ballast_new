import { ArrayMaxSize, ArrayUnique, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { SECTORS, SIZE_BANDS } from "@ballast/domain";

const sectors = SECTORS.map((s) => s.id);
const sizes = SIZE_BANDS.map((s) => s.id);

export class UpdateProfileDto {
  @IsIn(sectors)
  sector!: (typeof sectors)[number];

  @IsIn(sizes)
  sizeBand!: (typeof sizes)[number];

  @IsInt()
  @Min(1)
  @Max(20)
  siteCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  companyNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sicCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  council?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(80, { each: true })
  activities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  extraNotes?: string;

  @IsOptional()
  @IsArray()
  sites?: ProfileSiteInputDto[];

  @IsOptional()
  @IsIn(["profile", "activities", "review", "invite", "done"])
  onboardingStep?: "profile" | "activities" | "review" | "invite" | "done";
}

export class ProfileSiteInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  staffCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  kind?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  staffCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class OnboardingStepDto {
  @IsIn(["profile", "activities", "review", "invite", "done"])
  step!: "profile" | "activities" | "review" | "invite" | "done";
}

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsIn(["site_manager", "staff"])
  role!: "site_manager" | "staff";

  @IsOptional()
  @IsString()
  siteId?: string;
}

