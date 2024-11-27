import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUppercase,
} from "class-validator";
import { DefaultAppReleaseDto } from "./app-release-base.dto";

export class CreateAppReleaseDto extends DefaultAppReleaseDto {
}

