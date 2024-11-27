import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DashboardClientService } from "../../services/dashboard-client.service";
import { ApiResponseModel } from "src/core/models/api-response.model";

@ApiTags("dashboard-client")
@Controller("dashboard-client")
export class DashboardClientController {
  constructor(private dashboardClientService: DashboardClientService) {}

  @Get("getAnnouncementDashboardFeed/:clientCode")
  async getAnnouncementDashboardFeed(@Param("clientCode") clientCode: string) {
    const res = {} as any;
    try {
      res.data = await this.dashboardClientService.getAnnouncementDashboardFeed(
        clientCode
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("getClientAnnouncement")
  @ApiBody({
    schema: {
      properties: {
        clientCode: {
          type: "string",
        },
        searchKey: {
          type: "string",
        },
        pageSize: {
          type: "number",
        },
        pageIndex: {
          type: "number",
        },
      },
      required: ["clientCode", "searchKey", "pageSize", "pageIndex"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async getClientAnnouncement(
    @Body("clientCode") clientCode: string,
    @Body("searchKey") searchKey = "",
    @Body("pageSize") pageSize = 10,
    @Body("pageIndex") pageIndex = 1
  ) {
    const res = {} as any;
    try {
      res.data = await this.dashboardClientService.getClientAnnouncement({
        clientCode,
        searchKey,
        pageIndex,
        pageSize,
      });
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getClientStudents/:clientCode")
  @ApiQuery({ name: "date", required: true, type: Date })
  @ApiQuery({ name: "searchKey", required: false, type: String })
  //   @UseGuards(JwtAuthGuard)
  async getClientStudents(
    @Param("clientCode") clientCode: string,
    @Query("date") date = new Date(),
    @Query("searchKey") searchKey = ""
  ) {
    const res = {} as any;
    try {
      res.data = await this.dashboardClientService.getClientStudents(
        clientCode,
        date,
        searchKey
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getStudentsTapsByClientCode/:clientCode")
  @ApiQuery({ name: "date", required: true, type: Date })
  //   @UseGuards(JwtAuthGuard)
  async getStudentsTapsByClientCode(
    @Param("clientCode") clientCode: string,
    @Query("date") date = new Date()
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.dashboardClientService.getStudentsTapsByClientCode(
        clientCode,
        date
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getStudentsTapsByStudentCode/:studentCode")
  @ApiQuery({ name: "date", required: true, type: Date })
  //   @UseGuards(JwtAuthGuard)
  async getStudentsTapsByStudentCode(
    @Param("studentCode") studentCode: string,
    @Query("date") date = new Date()
  ) {
    const res = {} as ApiResponseModel<any>;
    try {
      res.data = await this.dashboardClientService.getStudentsTapsByStudentCode(
        studentCode,
        date
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("clientRequestNewDashboard")
  @ApiBody({
    schema: {
      properties: {
        clientCode: {
          type: "string",
        },
        type: {
          type: "string",
        },
      },
      required: ["clientCode", "type"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async clientRequestNewDashboard(
    @Body("clientCode") clientCode: string,
    @Body("type") type: "ANNOUNCEMENT" | "LINK_STUDENT" | "STUDENT_LOGIN_LOGOUT"
  ) {
    const res = {} as any;
    try {
      res.data = await this.dashboardClientService.clientRequestNewDashboard(
        clientCode,
        type
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
