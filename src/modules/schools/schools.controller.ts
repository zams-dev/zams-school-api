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
import { CreateSchoolDto } from "src/core/dto/schools/schools.create.dto";
import { UpdateSchoolDto } from "src/core/dto/schools/schools.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Schools } from "src/db/entities/Schools";
import { SchoolsService } from "src/services/schools.service";

@ApiTags("schools")
@Controller("schools")
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get("/:schoolCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("schoolCode") schoolCode: string) {
    const res = {} as ApiResponseModel<Schools>;
    try {
      res.data = await this.schoolsService.getByCode(schoolCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getByOrgCode/:orgSchoolCode")
  //   @UseGuards(JwtAuthGuard)
  async getByOrgCode(@Param("orgSchoolCode") orgSchoolCode: string) {
    const res = {} as ApiResponseModel<Schools>;
    try {
      res.data = await this.schoolsService.getByOrgCode(orgSchoolCode);
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
    const res: ApiResponseModel<{ results: Schools[]; total: number }> =
      {} as any;
    try {
      res.data = await this.schoolsService.getSchoolsPagination(params);
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
  async create(@Body() schoolsDto: CreateSchoolDto) {
    const res: ApiResponseModel<Schools> = {} as any;
    try {
      res.data = await this.schoolsService.create(schoolsDto);
      res.success = true;
      res.message = `Schools ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: CreateSchoolDto,
  })
  @Post("batchCreate")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() schoolsDtos: CreateSchoolDto[]) {
    const res: ApiResponseModel<Schools[]> = {} as any;
    try {
      res.data = await this.schoolsService.batchCreate(schoolsDtos);
      res.success = true;
      res.message = `Schools ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:schoolCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("schoolCode") schoolCode: string,
    @Body() dto: UpdateSchoolDto
  ) {
    const res: ApiResponseModel<Schools> = {} as any;
    try {
      res.data = await this.schoolsService.update(schoolCode, dto);
      res.success = true;
      res.message = `Schools ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:schoolCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("schoolCode") schoolCode: string) {
    const res: ApiResponseModel<Schools> = {} as any;
    try {
      res.data = await this.schoolsService.delete(schoolCode);
      res.success = true;
      res.message = `Schools ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
