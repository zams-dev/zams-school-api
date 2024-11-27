import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBooleanString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUppercase,
  Matches,
  ValidateNested,
} from "class-validator";
import moment from "moment-timezone";

export class DefaultTapLogDto {
  @ApiProperty({
    description: "The unique code representing the organization or school.",
    example: "SCHL12345",
  })
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty({
    description: "The gate tap machine",
    example: "RPI1",
  })
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: "The status indicating whether the user logged in or out.",
    example: "LOG IN",
    enum: ["LOG IN", "LOG OUT"],
  })
  @IsOptional()
  @IsIn(["LOG IN", "LOG OUT"])
  @IsUppercase()
  status: "LOG IN" | "LOG OUT";

  @ApiProperty({
    description: "The card number used by the user to log in or out.",
    example: "123456789012",
  })
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({
    description: "The type of user, either a student or an employee.",
    example: "STUDENT",
    enum: ["STUDENT", "EMPLOYEE"],
  })
  @IsOptional()
  @IsIn(["STUDENT", "EMPLOYEE"])
  @IsUppercase()
  userType: "STUDENT" | "EMPLOYEE";

  @ApiProperty({
    description: "The date of the log entry, in the format YYYY-MM-DD.",
    example: moment().format("YYYY-MM-DD"),
    default: moment().format("YYYY-MM-DD"),
  })
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: "The time of the log entry, in the format hh:mm AM/PM.",
    example: moment().format("hh:mm A"),
    default: moment().format("hh:mm A"),
  })
  @IsNotEmpty()
  @Transform(({ obj, key }) => obj[key]?.toString().toUpperCase())
  @Matches(/\b((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/g, {
    message: "Invalid time format",
  })
  time: string;
}
