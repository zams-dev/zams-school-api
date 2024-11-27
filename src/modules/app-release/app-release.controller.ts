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
import { CreateAppReleaseDto } from "src/core/dto/app-release/app-release.create.dto";
import { UpdateAppReleaseDto } from "src/core/dto/app-release/app-release.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { AppRelease } from "src/db/entities/AppRelease";
import { AppReleaseService } from "src/services/app-release.service";

@ApiTags("app-release")
@Controller("app-release")
export class AppReleaseController {
  constructor(private readonly appReleasesService: AppReleaseService) {}

  @Get("/:id")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("id") id: string) {
    const res = {} as ApiResponseModel<AppRelease>;
    try {
      res.data = await this.appReleasesService.getByCode(id);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
  @Get("/getLatestVersion/:appTypeCode")
  //   @UseGuards(JwtAuthGuard)
  async getLatestVersion(@Param("appTypeCode") appTypeCode: string) {
    const res = {} as ApiResponseModel<AppRelease>;
    try {
      res.data = await this.appReleasesService.getLatestVersion(
        appTypeCode as any
      );
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
    const res: ApiResponseModel<{ results: AppRelease[]; total: number }> =
      {} as any;
    try {
      res.data = await this.appReleasesService.getPagination(params);
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
  async create(@Body() dto: CreateAppReleaseDto) {
    const res: ApiResponseModel<AppRelease> = {} as any;
    try {
      res.data = await this.appReleasesService.create(dto);
      res.success = true;
      res.message = `App Release ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:id")
  //   @UseGuards(JwtAuthGuard)
  async update(@Param("id") id: string, @Body() dto: UpdateAppReleaseDto) {
    const res: ApiResponseModel<AppRelease> = {} as any;
    try {
      res.data = await this.appReleasesService.update(id, dto);
      res.success = true;
      res.message = `App Release ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:id")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string) {
    const res: ApiResponseModel<AppRelease> = {} as any;
    try {
      res.data = await this.appReleasesService.delete(id);
      res.success = true;
      res.message = `App Release ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
