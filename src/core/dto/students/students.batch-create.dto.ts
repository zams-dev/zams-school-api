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
} from "class-validator";
export class BatchCreateStudentDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsOptional()
  middleInitial: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  mobileNumber: string;

  @ApiProperty()
  @IsOptional()
  orgStudentId: string;

  @ApiProperty()
  @IsOptional()
  cardNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsOptional()
  courseName: string;

  @ApiProperty()
  @IsOptional()
  strandName: string;

  @ApiProperty()
  @IsOptional()
  sectionName: string;

  @ApiProperty()
  @IsOptional()
  departmentName: string;

  @ApiProperty()
  @IsOptional()
  schoolYearLevelName: string;

  @ApiProperty()
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  registeredByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  refId: string;
}
