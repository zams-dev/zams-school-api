import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumberString, IsUppercase } from "class-validator";
import { DefaultAnnouncementDto } from "./announcements-base.dto";
import { ANNOUNCEMENT_ACTIONS } from "src/common/constant/announcements.constant";

export class CreateAnnouncementDto extends DefaultAnnouncementDto {
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
