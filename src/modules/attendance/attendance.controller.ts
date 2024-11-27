import { Controller, Get, Param, Query, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
import moment from 'moment-timezone';
import { ApiResponseModel } from "src/core/models/api-response.model";
import { AttendanceService } from "src/services/attendance.service";

class TargetYearMonthDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "targetYearMonth must be in the format YYYY-MM",
  })
  targetYearMonth?: string = moment().format("YYYY-MM");
}

@Controller("attendance")
@ApiTags("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get("/tracker/:schoolCode")
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "date", required: false, type: Date })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "searchKey", required: false, type: String })
  @ApiQuery({ name: "pageNumber", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiQuery({ name: "orderColumn", required: false, type: String })
  @ApiQuery({ name: "orderDirection", required: false, type: String })
  //   @UseGuards(JwtAuthGuard)
  async getDashboardUsers(
    @Param("schoolCode") schoolCode: string,
    @Query("type") type: "STUDENT" | "EMPLOYEE" = "STUDENT",
    @Query("date") date = new Date(),
    @Query("status") status = "",
    @Query("searchKey") searchKey = "",
    @Query("pageNumber") pageNumber = 1,
    @Query("pageSize") pageSize = 10,
    @Query("orderColumn") orderColumn = "",
    @Query("orderDirection") orderDirection = "ASC"
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.attendanceService.getAttendanceTracker(
        schoolCode,
        type,
        new Date(date),
        status,
        searchKey,
        pageNumber,
        pageSize,
        orderColumn,
        orderDirection
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getStudentAttendance/:studentCode")
  @ApiQuery({ name: "targetYearMonth", required: false, type: String })
  //   @UseGuards(JwtAuthGuard)
  async getStudentAttendance(
    @Param("studentCode") studentCode: string,
    @Query(new ValidationPipe({ transform: true }))
    targetYearMonth: TargetYearMonthDto
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.attendanceService.getStudentAttendance(
        studentCode,
        targetYearMonth?.targetYearMonth
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getEmployeeAttendance/:employeeCode")
  @ApiQuery({ name: "targetYearMonth", required: false, type: String })
  //   @UseGuards(JwtAuthGuard)
  async getEmployeeAttendance(
    @Param("employeeCode") employeeCode: string,
    @Query(new ValidationPipe({ transform: true }))
    targetYearMonth: TargetYearMonthDto
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.attendanceService.getEmployeeAttendance(
        employeeCode,
        targetYearMonth?.targetYearMonth
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
