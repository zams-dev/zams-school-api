import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString, IsString } from "class-validator";
import { DefaultSchoolDto } from "./schools-base.dto";

export class CreateSchoolDto extends DefaultSchoolDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  registeredByUserId: string;

  @ApiProperty()
  @IsNotEmpty()
  defaulEmployeeDepartment = "School ZAMS Admin";

  @ApiProperty()
  @IsNotEmpty()
  defaultEmployeeTitleName = "School ZAMS Admin";

  @ApiProperty()
  @IsNotEmpty()
  defaultUserEmployeeFullName = "School ZAMS Admin";

  @ApiProperty()
  @IsNotEmpty()
  @IsNotEmpty()
  defaultEmployeeContactNumber = "00000000000";

  @ApiProperty()
  @IsNotEmpty()
  defaultEmployeeCardNumber = "MC0100001";

  @ApiProperty()
  @IsNotEmpty()
  defaultEmployeeIdNumber = "MC0100001";

  @ApiProperty()
  @IsNotEmpty()
  defaultUserName = "mc01-zams-admin";

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  defaultUserPassword = "123456";

  @ApiProperty()
  @IsNotEmpty()
  defaultUserAccessName = "School ZAMS Admin";
}
