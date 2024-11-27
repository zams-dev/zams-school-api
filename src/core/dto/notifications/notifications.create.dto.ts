import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString } from "class-validator";
import { DefaultNotificationsDto } from "./notifications-base.dto";

export class CreateNotificationsDto extends DefaultNotificationsDto {
}
