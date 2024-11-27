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
import {
  BatchCreateEmployeeTitleDto,
  CreateEmployeeTitleDto,
} from "src/core/dto/employee-titles/employee-titles.create.dto";
import { UpdateEmployeeTitleDto } from "src/core/dto/employee-titles/employee-titles.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { EmployeeTitlesService } from "src/services/employee-titles.service";

@ApiTags("employeeTitles")
@Controller("employeeTitles")
export class EmployeeTitlesController {
  constructor(private readonly employeeTitlesService: EmployeeTitlesService) {}

  @Get("/:employeeTitleCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("employeeTitleCode") employeeTitleCode: string) {
    const res = {} as ApiResponseModel<EmployeeTitles>;
    try {
      res.data = await this.employeeTitlesService.getByCode(employeeTitleCode);
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
    const res: ApiResponseModel<{ results: EmployeeTitles[]; total: number }> =
      {} as any;
    try {
      res.data = await this.employeeTitlesService.getEmployeeTitlesPagination(
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
  async create(@Body() employeeTitlesDto: CreateEmployeeTitleDto) {
    const res: ApiResponseModel<EmployeeTitles> = {} as any;
    try {
      res.data = await this.employeeTitlesService.create(employeeTitlesDto);
      res.success = true;
      res.message = `Employee Titles ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: BatchCreateEmployeeTitleDto,
  })
  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() dtos: BatchCreateEmployeeTitleDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.employeeTitlesService.batchCreate(dtos);
      res.success = true;
      res.message = `Employee Titles Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:employeeTitleCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("employeeTitleCode") employeeTitleCode: string,
    @Body() dto: UpdateEmployeeTitleDto
  ) {
    const res: ApiResponseModel<EmployeeTitles> = {} as any;
    try {
      res.data = await this.employeeTitlesService.update(
        employeeTitleCode,
        dto
      );
      res.success = true;
      res.message = `Employee Titles ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:employeeTitleCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("employeeTitleCode") employeeTitleCode: string) {
    const res: ApiResponseModel<EmployeeTitles> = {} as any;
    try {
      res.data = await this.employeeTitlesService.delete(employeeTitleCode);
      res.success = true;
      res.message = `Employee Titles ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
