import { Controller, Get, Param, Query } from "@nestjs/common";
import { DateTimeCheckerService } from "./date-time-checker.service";
import { ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ApiResponseModel } from "src/core/models/api-response.model";

@ApiTags("date-time-checker")
@Controller("date-time-checker")
export class DateTimeCheckerController {
  constructor(
    private readonly dateTimeCheckerService: DateTimeCheckerService
  ) {}

  @Get("utc-desired-timezone/:date")
  @ApiParam({ name: "date", required: true, type: String })
  @ApiQuery({ name: "timezone", required: true, type: String })
  //   @UseGuards(JwtAuthGuard)
  async fromUTCToDesiredTimezone(
    @Param("date") date: string,
    @Query("timezone") timezone: string
  ) {
    const res = {} as ApiResponseModel<{
      utc: string;
      result: string;
  }>;
    try {
      res.data = await this.dateTimeCheckerService.fromUTCToDesiredTimezone(
        date,
        timezone
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
