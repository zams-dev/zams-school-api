import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiProperty, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Validate,
  ValidateNested,
  ValidationArguments,
} from "class-validator";
import moment from "moment-timezone";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { DashboardOrganizationService } from "src/services/dashboard-organization.service";
import { ArrayContains } from "typeorm";

@ApiTags("dashboard-organization")
@Controller("dashboard-organization")
export class DashboardOrganizationController {
  constructor(
    private readonly dashboardOrganizationService: DashboardOrganizationService
  ) {}

  @Get("/getDashboardSummary/:schoolCode")
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "targetDate", required: false, type: Date })
  //   @UseGuards(JwtAuthGuard)
  async getDashboardUsers(
    @Param("schoolCode") schoolCode: string,
    @Query("type") type: "STUDENT" | "EMPLOYEE" = "STUDENT",
    @Query("targetDate") targetDate = new Date()
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.dashboardOrganizationService.getDashboardSummary(
        schoolCode,
        type,
        targetDate
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/getAttendanceByRange/:schoolCode")
  @ApiQuery({
    name: "frequency",
    description: `Options: ["RANGE",  "WEEKLY", "MONTHLY", "ANNUALLY"], defaults to "MONTHLY"`,
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "type",
    description: `Options: ["STUDENT",  "EMPLOYEE"], defaults to "STUDENT"`,
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "date",
    description: `Date range in comma seperated strings ex: "${[
      moment().format("YYYY-MM-DD"),
      moment().format("YYYY-MM-DD"),
    ].toString()}"`,
    required: false,
    type: String,
  })
  //   @UseGuards(JwtAuthGuard)
  async getAttendanceByRange(
    @Param("schoolCode") schoolCode: string,
    @Query("frequency")
    frequency: "RANGE" | "WEEKLY" | "MONTHLY" | "ANNUALLY" = "MONTHLY",
    @Query("type") type: "STUDENT" | "EMPLOYEE" = "STUDENT",
    @Query("date")
    date: string = [
      moment().format("YYYY-MM-DD"),
      moment().format("YYYY-MM-DD"),
    ].toString()
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.dashboardOrganizationService.getAttendanceByRange(
        schoolCode,
        frequency,
        type,
        {
          startDate: new Date(date.split(",")[0]),
          endDate: new Date(date.split(",")[1]),
        }
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/getAttendanceRatio/:schoolCode")
  @ApiQuery({
    name: "type",
    description: `Options: ["STUDENT",  "EMPLOYEE"], defaults to "STUDENT"`,
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "date",
    description: `Date range in comma seperated strings ex: "${[
      moment().format("YYYY-MM-DD"),
      moment().format("YYYY-MM-DD"),
    ].toString()}"`,
    required: false,
    type: String,
  })
  //   @UseGuards(JwtAuthGuard)
  async getAttendanceRatio(
    @Param("schoolCode") schoolCode: string,
    @Query("type") type: "STUDENT" | "EMPLOYEE" = "STUDENT",
    @Query("date")
    date: string = [
      moment().format("YYYY-MM-DD"),
      moment().format("YYYY-MM-DD"),
    ].toString()
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.dashboardOrganizationService.getAttendanceRatio(
        schoolCode,
        type,
        {
          startDate: new Date(date.split(",")[0]),
          endDate: new Date(date.split(",")[1]),
        }
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
