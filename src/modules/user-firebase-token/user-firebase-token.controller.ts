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
import { DefaultUserFirebaseTokenDto } from "src/core/dto/user-firebase-token/user-firebase-token-base.dto";
import { CreateUserFirebaseTokenDto } from "src/core/dto/user-firebase-token/user-firebase-token.create.dto";
import { UpdateUserFirebaseTokenDto } from "src/core/dto/user-firebase-token/user-firebase-token.update.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { UserFirebaseToken } from "src/db/entities/UserFirebaseToken";
import { UserFirebaseTokenService } from "src/services/user-firebase-token.service";

@ApiTags("user-firebase-token")
@Controller("user-firebase-token")
export class UserFirebaseTokenController {
  constructor(
    private readonly userFirebaseTokensService: UserFirebaseTokenService
  ) {}

  @Post("/getByDevice")
  async getByDevice(@Body() params: DefaultUserFirebaseTokenDto) {
    const res: ApiResponseModel<UserFirebaseToken> = {} as any;
    try {
      res.data = await this.userFirebaseTokensService.getByUserDevice(
        params.userId,
        params.device
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
  async create(@Body() userFirebaseTokensDto: CreateUserFirebaseTokenDto) {
    const res: ApiResponseModel<UserFirebaseToken> = {} as any;
    try {
      res.data = await this.userFirebaseTokensService.create(
        userFirebaseTokensDto
      );
      res.success = true;
      res.message = `UserFirebaseToken ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
