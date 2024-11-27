import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { CreateNotificationsDto } from "src/core/dto/notifications/notifications.create.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Notifications } from "src/db/entities/Notifications";
import { NotificationsService } from "src/services/notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("/getUnreadByUser/:userId")
  //   @UseGuards(JwtAuthGuard)
  async getUnreadByUser(@Param("userId") userId: string) {
    const res: ApiResponseModel<any> = {} as any;
    try {
      res.data = await this.notificationsService.getUnreadByUser(userId);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/page")
  //   @UseGuards(JwtAuthGuard)
  async getPaginated(@Body() params: PaginationParamsDto) {
    const res: ApiResponseModel<{
      results: Notifications[];
      total: number;
    }> = {} as any;
    try {
      res.data = await this.notificationsService.getPagination(params);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/test/")
  //   @UseGuards(JwtAuthGuard)
  async test(@Body() params: CreateNotificationsDto) {
    const res: ApiResponseModel<Notifications> = {} as any;
    try {
      // await this.notificationsService.test(params);
      res.success = true;
      res.message = `Notifications ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/marAsRead/:notificationId/")
  @ApiBody({
    schema: {
      properties: {
        userId: {
          type: "string",
        },
      },
      required: ["userId"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param("notificationId") notificationId: string,
    @Body("userId") userId: string
  ) {
    const res: ApiResponseModel<Notifications> = {} as any;
    try {
      res.data = await this.notificationsService.markAsRead(
        notificationId,
        userId
      );
      res.success = true;
      res.message = `Notifications ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
