import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsIn, IsUppercase } from "class-validator";
import { DefaultNotificationsDto } from "./notifications-base.dto";

export class UpdateNotificationsDto extends DefaultNotificationsDto {}

