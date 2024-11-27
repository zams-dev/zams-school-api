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
import { CreateEmployeeUserAccessDto } from "src/core/dto/employee-user-access/employee-user-access.create.dto";
import { UpdateEmployeeUserAccessDto } from "src/core/dto/employee-user-access/employee-user-access.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { EmployeeUserAccess } from "src/db/entities/EmployeeUserAccess";
import { EmployeeUserAccessService } from "src/services/employee-user-access.service";

@ApiTags("employeeUserAccess")
@Controller("employeeUserAccess")
export class EmployeeUserAccessController {
  constructor(
    private readonly employeeUserAccessService: EmployeeUserAccessService
  ) {}

  @Get("/:employeeUserAccessCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(
    @Param("employeeUserAccessCode") employeeUserAccessCode: string
  ) {
    const res = {} as ApiResponseModel<EmployeeUserAccess>;
    try {
      res.data = await this.employeeUserAccessService.getByCode(
        employeeUserAccessCode
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
      results: EmployeeUserAccess[];
      total: number;
    }> = {} as any;
    try {
      res.data =
        await this.employeeUserAccessService.getEmployeeUserAccessPagination(
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
  async create(@Body() employeeUserAccessDto: CreateEmployeeUserAccessDto) {
    const res: ApiResponseModel<EmployeeUserAccess> = {} as any;
    try {
      res.data = await this.employeeUserAccessService.create(
        employeeUserAccessDto
      );
      res.success = true;
      res.message = `Employee User Access ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:employeeUserAccessCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("employeeUserAccessCode") employeeUserAccessCode: string,
    @Body() dto: UpdateEmployeeUserAccessDto
  ) {
    const res: ApiResponseModel<EmployeeUserAccess> = {} as any;
    try {
      res.data = await this.employeeUserAccessService.update(
        employeeUserAccessCode,
        dto
      );
      res.success = true;
      res.message = `Employee User Access ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:employeeUserAccessCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(
    @Param("employeeUserAccessCode") employeeUserAccessCode: string
  ) {
    const res: ApiResponseModel<EmployeeUserAccess> = {} as any;
    try {
      res.data = await this.employeeUserAccessService.delete(
        employeeUserAccessCode
      );
      res.success = true;
      res.message = `Employee User Access ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
