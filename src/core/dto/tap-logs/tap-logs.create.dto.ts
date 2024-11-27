import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString } from "class-validator";
import { DefaultTapLogDto } from "./tap-logs-base.dto";

export class CreateTapLogDto extends DefaultTapLogDto {
  @ApiProperty({
    description: "A unique reference ID for the tap log.",
    example: "12345abcde",
  })
  @IsNotEmpty()
  refId: string;
}
