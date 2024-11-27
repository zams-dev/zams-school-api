import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString } from "class-validator";
import { DefaultUserOneSignalSubscriptionDto } from "./user-one-signal-subscription-base.dto";

export class UpdateUserOneSignalSubscriptionDto extends DefaultUserOneSignalSubscriptionDto {
}
