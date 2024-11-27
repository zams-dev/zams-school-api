import { IsNotEmpty, IsOptional } from "class-validator";
import { Match } from "../match.decorator.dto";
import { ApiProperty } from "@nestjs/swagger";


export class UpdateProfilePictureDto {
  @ApiProperty()
  @IsOptional()
  userProfilePic: any;
}