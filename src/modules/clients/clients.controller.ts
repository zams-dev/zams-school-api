import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Headers,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Clients } from "src/db/entities/Clients";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { UpdateProfilePictureDto } from "src/core/dto/auth/reset-password.dto copy";
import { ClientsService } from "src/services/clients.service";
import { UpdateClientUserProfileDto } from "src/core/dto/clients/clients.update.dto";
import { PaginatedQueryDto } from "src/core/dto/pagination-query.dto";
import { PaginationParseQueryParamsPipe } from "src/core/pipe/pagination-parse-query.pipe";

@ApiTags("clients")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("/page")
  @ApiHeader({
    name: "schoolCode",
    description: "School Code",
  })
  //   @UseGuards(JwtAuthGuard)
  async getPaginated(
    @Query(
      new PaginationParseQueryParamsPipe(),
      new ValidationPipe({ transform: true })
    )
    query: PaginatedQueryDto,
    @Headers("schoolCode")
    orgSchoolCode = null
  ) {
    const res: ApiResponseModel<{ results: Clients[]; total: number }> =
      {} as any;
    try {
      res.data = await this.clientsService.getPagination(
        query as any,
        orgSchoolCode
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/:clientCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("clientCode") clientCode: string) {
    const res = {} as ApiResponseModel<Clients>;
    try {
      res.data = await this.clientsService.getByCode(clientCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("updateProfile/:clientCode")
  //   @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param("clientCode") clientCode: string,
    @Body() dto: UpdateClientUserProfileDto
  ) {
    const res: ApiResponseModel<Clients> = {} as any;
    try {
      res.data = await this.clientsService.updateProfile(clientCode, dto);
      res.success = true;
      res.message = `Client ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:clientCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("clientCode") clientCode: string) {
    const res: ApiResponseModel<Clients> = {} as any;
    try {
      res.data = await this.clientsService.delete(clientCode);
      res.success = true;
      res.message = `Client ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/updateProfilePicture/:clientCode")
  async updateProfilePicture(
    @Param("clientCode") clientCode: string,
    @Body() dto: UpdateProfilePictureDto
  ) {
    const res: ApiResponseModel<Clients> = {} as any;
    try {
      res.data = await this.clientsService.updateProfilePicture(
        clientCode,
        dto
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
