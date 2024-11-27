import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsString,
  Min,
  IsNotEmpty,
  IsNumberString,
} from "class-validator";

export class PaginatedQueryDto {
  @ApiProperty({
    name: "pageSize",
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  pageSize = 10;

  @ApiProperty({
    name: "pageIndex",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  pageIndex = 0;

  @ApiProperty({
    name: "order",
    type: String,
  })
  @IsNotEmpty()
  order = JSON.stringify({});

  @ApiProperty({
    name: "columnDef",
    type: String,
  })
  @IsNotEmpty()
  columnDef = JSON.stringify([]);
}
