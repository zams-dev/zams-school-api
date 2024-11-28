import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
  DELETE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { DefaultUserOneSignalSubscriptionDto } from "src/core/dto/user-one-signal-subscription/user-one-signal-subscription-base.dto";
import { CreateUserOneSignalSubscriptionDto } from "src/core/dto/user-one-signal-subscription/user-one-signal-subscription.create.dto";
import { UpdateUserOneSignalSubscriptionDto } from "src/core/dto/user-one-signal-subscription/user-one-signal-subscription.update.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { UserOneSignalSubscription } from "src/db/entities/UserOneSignalSubscription";
import { UserOneSignalSubscriptionService } from "src/services/user-one-signal-subscription.service";

@ApiTags("user-one-signal-subscription")
@Controller("user-one-signal-subscription")
export class UserOneSignalSubscriptionController {
  constructor(
    private readonly userOneSignalSubscriptionsService: UserOneSignalSubscriptionService
  ) {}

  @Get("/getBySubscriptionId/:subscriptionId")
  async getBySubscriptionId(@Param("subscriptionId") subscriptionId: string) {
    const res: ApiResponseModel<UserOneSignalSubscription> = {} as any;
    try {
      res.data =
        await this.userOneSignalSubscriptionsService.getBySubscriptionId(
          subscriptionId
        );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("")
  //   @UseGuards(JwtAuthGuard)
  async create(
    @Body() userOneSignalSubscriptionsDto: CreateUserOneSignalSubscriptionDto
  ) {
    const res: ApiResponseModel<UserOneSignalSubscription> = {} as any;
    try {
      res.data = await this.userOneSignalSubscriptionsService.create(
        userOneSignalSubscriptionsDto
      );
      res.success = true;
      res.message = `User One Signal Subscription ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
