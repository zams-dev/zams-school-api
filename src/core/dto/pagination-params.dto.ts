import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PaginationParamsDto {
  @ApiProperty({
    default: 10,
  })
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  pageSize: string;

  @ApiProperty({
    default: 0,
  })
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  pageIndex: string;

  @ApiProperty({})
  @IsNotEmpty()
  order = {} as any;

  @ApiProperty({
    isArray: true,
    default: []
  })
  @IsArray()
  @IsNotEmpty()
  columnDef = [];
}
