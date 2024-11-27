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

export class DefaultNotificationsDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string
  @ApiProperty()
  @IsNotEmpty()
  description: string
  @ApiProperty()
  @IsNotEmpty()
  userId: string
}

