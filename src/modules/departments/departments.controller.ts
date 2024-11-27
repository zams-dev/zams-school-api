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
  BatchCreateDepartmentDto,
  CreateDepartmentDto,
} from "src/core/dto/departments/departments.create.dto";
import { UpdateDepartmentDto } from "src/core/dto/departments/departments.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Departments } from "src/db/entities/Departments";
import { DepartmentsService } from "src/services/departments.service";

@ApiTags("departments")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get("/:departmentCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("departmentCode") departmentCode: string) {
    const res = {} as ApiResponseModel<Departments>;
    try {
      res.data = await this.departmentsService.getByCode(departmentCode);
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
    const res: ApiResponseModel<{ results: Departments[]; total: number }> =
      {} as any;
    try {
      res.data = await this.departmentsService.getDepartmentsPagination(params);
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
  async create(@Body() departmentsDto: CreateDepartmentDto) {
    const res: ApiResponseModel<Departments> = {} as any;
    try {
      res.data = await this.departmentsService.create(departmentsDto);
      res.success = true;
      res.message = `Departments ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: BatchCreateDepartmentDto,
  })
  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() dtos: BatchCreateDepartmentDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.departmentsService.batchCreate(dtos);
      res.success = true;
      res.message = `Departments Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:departmentCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("departmentCode") departmentCode: string,
    @Body() dto: UpdateDepartmentDto
  ) {
    const res: ApiResponseModel<Departments> = {} as any;
    try {
      res.data = await this.departmentsService.update(departmentCode, dto);
      res.success = true;
      res.message = `Departments ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:departmentCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("departmentCode") departmentCode: string) {
    const res: ApiResponseModel<Departments> = {} as any;
    try {
      res.data = await this.departmentsService.delete(departmentCode);
      res.success = true;
      res.message = `Departments ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
