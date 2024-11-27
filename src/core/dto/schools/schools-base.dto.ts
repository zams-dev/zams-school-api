import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBooleanString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from "class-validator";

export class DefaultSchoolDto {
  @ApiProperty()
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty()
  @IsNotEmpty()
  schoolAddress: string;

  // @ApiProperty()
  // @IsOptional()
  // schoolContactNumber: string;

  // @ApiProperty()
  // @IsOptional()
  // schoolEmail: string;

  // @ApiProperty()
  // @IsOptional()
  // studentsAllowableTimeLate: string;

  // @ApiProperty()
  // @IsOptional()
  // studentsTimeLate: string;

  // @ApiProperty({
  //   default: false,
  //   type: Boolean
  // })
  // @IsOptional()
  // @Type(() => Boolean)
  // @Transform(({ obj, key }) => {
  //   return obj[key]?.toString();
  // })
  // restrictGuardianTime = false;

  // @ApiProperty()
  // @IsOptional()
  // employeesTimeBeforeSwipeIsAllowed: string;

  // @ApiProperty()
  // @IsOptional()
  // employeesAllowableTimeLate: string;

  // @ApiProperty()
  // @IsOptional()
  // employeesTimeLate: string;

  // @ApiProperty()
  // @IsOptional()
  // timeBeforeSwipeIsAllowed: string;

  // @ApiProperty()
  // @IsOptional()
  // smsNotificationForStaffEntry: string;

  // @ApiProperty()
  // @IsOptional()
  // smsNotificationForStudentBreakTime: string;
}
