import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString, IsOptional } from "class-validator";
import { DefaultSectionDto } from "./sections-base.dto";

export class CreateSectionDto extends DefaultSectionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  createdByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  schoolId: string;
}


export class BatchCreateSectionDto {
  @ApiProperty()
  @IsNotEmpty()
  sectionName: string;

  @ApiProperty()
  @IsNotEmpty()
  adviserOrgEmployeeId: string;

  @ApiProperty()
  @IsOptional()
  departmentName: string;

  @ApiProperty()
  @IsOptional()
  schoolYearLevelName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  createdByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  orgSchoolCode: string;

  @ApiProperty()
  @IsNotEmpty()
  refId: string;
}

