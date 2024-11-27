import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBooleanString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUppercase,
  Matches,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import moment from "moment-timezone";
import {
  ANNOUNCEMENT_AUDIENCE_MODE,
  ANNOUNCEMENT_AUDIENCE_TYPE,
  TARGET_RECIPIENT_TYPE,
} from "src/common/constant/announcements.constant";

export class StudentFilterDto {
  @ApiProperty({
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  schoolYearLevelIds: string[] = [];

  @ApiProperty({
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  sectionIds: string[] = [];
}
export class EmployeeFilterDto {
  @ApiProperty({
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  employeeTitleIds: string[] = [];

  @ApiProperty({
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  departmentIds: string[] = [];
}
export class TargetRecipientDto {
  @ApiProperty({
    required: true,
    type: String,
    enum: TARGET_RECIPIENT_TYPE,
  })
  @IsNotEmpty()
  @IsUppercase()
  @IsIn([TARGET_RECIPIENT_TYPE.STUDENT, TARGET_RECIPIENT_TYPE.EMPLOYEE])
  type: TARGET_RECIPIENT_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsOptional()
  fullName: string;
}

export class DefaultAnnouncementDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    required: true,
    isArray: true,
    default: [],
    enum: ANNOUNCEMENT_AUDIENCE_TYPE,
    type: [String],
  })
  @ValidateIf(
    (obj) => obj.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY
  )
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Array)
  @IsIn(
    [
      ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE,
      ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL,
      ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL,
      ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL,
      ANNOUNCEMENT_AUDIENCE_TYPE.COLLEGE,
    ],
    { each: true }
  )
  audienceType: ANNOUNCEMENT_AUDIENCE_TYPE[] = [];

  @ApiProperty({
    required: true,
    type: String,
    enum: ANNOUNCEMENT_AUDIENCE_MODE,
  })
  @IsNotEmpty()
  @IsUppercase()
  @IsIn([
    ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_ALL,
    ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY,
    ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_ONE,
  ])
  audienceMode: ANNOUNCEMENT_AUDIENCE_MODE;

  @ApiProperty({
    default: moment().format("YYYY-MM-DD hh:mm A"),
    description: "Date and time in format YYYY-MM-DD hh:mm A",
    pattern: "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2} (AM|PM)$",
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} (AM|PM)$/, {
    message: "Date must be in the format YYYY-MM-DD hh:mm AM/PM",
  })
  targetDateTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  @IsBooleanString()
  isSchedule: boolean;

  @ApiProperty({ type: TargetRecipientDto })
  @ValidateIf((o) => o.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_ONE) // Only validate if audienceMode is SEND_TO_ONE
  @IsNotEmpty() // Ensures the entire object is not empty
  @ValidateNested() // Enables validation of nested properties
  @Type(() => TargetRecipientDto) // Necessary for class-transformer to recognize the nested DTO
  targetRecipient: TargetRecipientDto;
}
