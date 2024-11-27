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
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import {
  BatchCreateSchoolYearLevelDto,
  CreateSchoolYearLevelDto,
} from "src/core/dto/school-year-levels/school-year-levels.create.dto";
import { UpdateSchoolYearLevelDto } from "src/core/dto/school-year-levels/school-year-levels.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { SchoolYearLevelsService } from "src/services/school-year-levels.service";

@ApiTags("schoolYearLevels")
@Controller("schoolYearLevels")
export class SchoolYearLevelsController {
  constructor(
    private readonly schoolYearLevelsService: SchoolYearLevelsService
  ) {}

  @Get("/:schoolYearLevelCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("schoolYearLevelCode") schoolYearLevelCode: string) {
    const res = {} as ApiResponseModel<SchoolYearLevels>;
    try {
      res.data = await this.schoolYearLevelsService.getByCode(
        schoolYearLevelCode
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
    const res: ApiResponseModel<{
      results: SchoolYearLevels[];
      total: number;
    }> = {} as any;
    try {
      res.data =
        await this.schoolYearLevelsService.getSchoolYearLevelsPagination(
          params
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
  async create(@Body() schoolYearLevelsDto: CreateSchoolYearLevelDto) {
    const res: ApiResponseModel<SchoolYearLevels> = {} as any;
    try {
      res.data = await this.schoolYearLevelsService.create(schoolYearLevelsDto);
      res.success = true;
      res.message = `School Year Levels ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() dtos: BatchCreateSchoolYearLevelDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.schoolYearLevelsService.batchCreate(dtos);
      res.success = true;
      res.message = `School year level Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:schoolYearLevelCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("schoolYearLevelCode") schoolYearLevelCode: string,
    @Body() dto: UpdateSchoolYearLevelDto
  ) {
    const res: ApiResponseModel<SchoolYearLevels> = {} as any;
    try {
      res.data = await this.schoolYearLevelsService.update(
        schoolYearLevelCode,
        dto
      );
      res.success = true;
      res.message = `School Year Levels ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:schoolYearLevelCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("schoolYearLevelCode") schoolYearLevelCode: string) {
    const res: ApiResponseModel<SchoolYearLevels> = {} as any;
    try {
      res.data = await this.schoolYearLevelsService.delete(schoolYearLevelCode);
      res.success = true;
      res.message = `School Year Levels ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
