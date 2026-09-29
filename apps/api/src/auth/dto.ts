import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class SignUpDto {
  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;

  @ValidateIf((dto: UpdateMeDto) => Boolean(dto.currentPassword || dto.newPassword))
  @IsString()
  @MinLength(8)
  newPassword?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

