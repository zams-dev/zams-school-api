import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString } from "class-validator";
import { DefaultUserFirebaseTokenDto } from "./user-firebase-token-base.dto";

export class CreateUserFirebaseTokenDto extends DefaultUserFirebaseTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  firebaseToken: string;
}
