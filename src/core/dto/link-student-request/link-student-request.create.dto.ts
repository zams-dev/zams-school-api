import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUppercase,
} from "class-validator";
import { DefaultLinkStudentRequestDto } from "./link-student-request-base.dto";

export class CreateLinkStudentRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  requestedByClientCode: string;

  @ApiProperty()
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty()
  @IsOptional()
  orgStudentId: string;

  @ApiProperty({
    type: String
  })
  @IsNotEmpty()
  @IsIn(["ID", "NAME"])
  @IsUppercase()
  @IsString()
  studentSearchOption = "";

  @ApiProperty()
  @IsOptional()
  requestMessage: string;

  @ApiProperty()
  @IsOptional()
  requestStudentName: string;
}
