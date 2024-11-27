import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { DefaultEmployeeUserAccessDto } from "./employee-user-access-base.dto";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class CreateEmployeeUserAccessDto extends DefaultEmployeeUserAccessDto {
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
