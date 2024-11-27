import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumberString,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
  IsBooleanString,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsUppercase,
  Matches,
  IsUUID,
} from "class-validator";
import { DefaultEmployeeUserDto } from "./employee-user-base.dto";


export class UpdateEmployeeUserDto extends DefaultEmployeeUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  updatedByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  employeeUserAccessId: string;
}


export class UpdateEmployeeUserProfileDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsOptional()
  mobileNumber: string;
}

export class UpdateEmployeeUserProfilePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  password: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;
}