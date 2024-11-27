import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUppercase,
  ValidateNested,
} from "class-validator";
import {
  DefaultAnnouncementDto,
  EmployeeFilterDto,
  StudentFilterDto,
} from "./announcements-base.dto";

export class UpdateAnnouncementDto extends DefaultAnnouncementDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  updatedByUserId: string;

  @ApiProperty({
    type: String,
    default: "UPDATE",
  })
  @IsNotEmpty()
  @IsIn(["UPDATE", "SEND"])
  @IsUppercase()
  actions: "UPDATE" | "SEND" = "UPDATE";

  @ApiProperty({
    type: EmployeeFilterDto,
  })
  @IsOptional()
  @Type(() => EmployeeFilterDto)
  @ValidateNested()
  employeeFilter: EmployeeFilterDto;

  @ApiProperty({
    type: StudentFilterDto,
  })
  @IsOptional()
  @Type(() => StudentFilterDto)
  @ValidateNested()
  studentPrimaryFilter: StudentFilterDto;

  @ApiProperty({
    type: StudentFilterDto,
  })
  @IsOptional()
  @Type(() => StudentFilterDto)
  @ValidateNested()
  studentJuniorFilter: StudentFilterDto;

  @ApiProperty({
    type: StudentFilterDto,
  })
  @IsOptional()
  @Type(() => StudentFilterDto)
  @ValidateNested()
  studentSeniorFilter: StudentFilterDto;
  
  @ApiProperty({
    type: Array,
  })
  @IsArray()
  @IsOptional()
  employeeExcluded = [];
  
  @ApiProperty({
    type: Array,
  })
  @IsArray()
  @IsOptional()
  studentPrimaryExlcuded = [];
  
  @ApiProperty({
    type: Array,
  })
  @IsArray()
  @IsOptional()
  studentJuniorExcluded = [];
  
  @ApiProperty({
    type: Array,
  })
  @IsArray()
  @IsOptional()
  studentSeniorExcluded = [];
}
