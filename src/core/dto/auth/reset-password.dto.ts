import { IsEmail, IsNotEmpty, IsUUID } from "class-validator";
import { Match } from "../match.decorator.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  password: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  verificationCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class UpdateUserPasswordFromAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
