import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString, IsUUID } from "class-validator";
import { DefaultClientUserDto } from "../clients/clients-base.dto";
export class RegisterClientUserDto extends DefaultClientUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  verificationCode: string;

  @ApiProperty()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  @IsNotEmpty()
  password: string;
}