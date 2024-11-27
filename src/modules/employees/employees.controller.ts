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
import { BatchCreateEmployeeDto } from "src/core/dto/employees/employees.batch-create.dto";
import { CreateEmployeeDto } from "src/core/dto/employees/employees.create.dto";
import { UpdateEmployeeDto } from "src/core/dto/employees/employees.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Employees } from "src/db/entities/Employees";
import { EmployeesService } from "src/services/employees.service";

@ApiTags("employees")
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get("/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("employeeCode") employeeCode: string) {
    const res = {} as ApiResponseModel<Employees>;
    try {
      res.data = await this.employeesService.getByCode(employeeCode);
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
    const res: ApiResponseModel<{ results: Employees[]; total: number }> =
      {} as any;
    try {
      res.data = await this.employeesService.getPagination(params);
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
  async create(@Body() employeesDto: CreateEmployeeDto) {
    const res: ApiResponseModel<Employees> = {} as any;
    try {
      res.data = await this.employeesService.create(employeesDto);
      res.success = true;
      res.message = `Employee ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: BatchCreateEmployeeDto,
  })
  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async createBatch(@Body() employeeDtos: BatchCreateEmployeeDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.employeesService.createBatch(employeeDtos);
      res.success = true;
      res.message = `Employee Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("employeeCode") employeeCode: string,
    @Body() dto: UpdateEmployeeDto
  ) {
    const res: ApiResponseModel<Employees> = {} as any;
    try {
      res.data = await this.employeesService.update(employeeCode, dto);
      res.success = true;
      res.message = `Employee ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("employeeCode") employeeCode: string) {
    const res: ApiResponseModel<Employees> = {} as any;
    try {
      res.data = await this.employeesService.delete(employeeCode);
      res.success = true;
      res.message = `Employee ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
