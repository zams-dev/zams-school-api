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
export class BatchCreateEmployeeDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsOptional()
  mobileNumber: string;

  @ApiProperty()
  @IsOptional()
  orgEmployeeId: string;

  @ApiProperty()
  @IsOptional()
  cardNumber: string;

  @ApiProperty()
  @IsOptional()
  departmentName: string;

  @ApiProperty()
  @IsOptional()
  employeeTitleName: string;

  @ApiProperty()
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  createdByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  refId: string;
}
