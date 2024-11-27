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
import { DefaultOperatorUserDto } from "./operators-base.dto";


export class UpdateOperatorUserDto extends DefaultOperatorUserDto {
}


export class UpdateOperatorUserProfileDto extends DefaultOperatorUserDto {
}