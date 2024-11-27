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
  REGISTER_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { UpdateUserPasswordFromAdminDto, UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import {
  CreateEmployeeUserDto,
  CreateEmployeeUserFromEmployeeDto,
} from "src/core/dto/employee-user/employee-user.create.dto";
import {
  UpdateEmployeeUserDto,
  UpdateEmployeeUserProfileDto,
  UpdateEmployeeUserProfilePasswordDto,
} from "src/core/dto/employee-user/employee-user.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { EmployeeUserService } from "src/services/employee-user.service";

@ApiTags("employee-user")
@Controller("employee-user")
export class EmployeeUserController {
  constructor(private readonly employeeUserService: EmployeeUserService) {}

  @Get("/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("employeeCode") employeeCode: string) {
    const res = {} as ApiResponseModel<EmployeeUser>;
    try {
      res.data = await this.employeeUserService.getByEmployeeCode(employeeCode);
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
    const res: ApiResponseModel<{ results: EmployeeUser[]; total: number }> =
      {} as any;
    try {
      res.data = await this.employeeUserService.getPagination(params);
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
  async create(@Body() dto: CreateEmployeeUserDto) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.create(dto);
      res.success = true;
      res.message = `Employee User ${REGISTER_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("createFromEmployee")
  //   @UseGuards(JwtAuthGuard)
  async createFromEmployee(@Body() dto: CreateEmployeeUserFromEmployeeDto) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.createFromEmployee(dto);
      res.success = true;
      res.message = `Employee User ${REGISTER_SUCCESS}`;
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
    @Body() dto: UpdateEmployeeUserDto
  ) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.update(employeeCode, dto);
      res.success = true;
      res.message = `Employee User ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("updateProfile/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param("employeeCode") employeeCode: string,
    @Body() dto: UpdateEmployeeUserProfileDto
  ) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.updateProfile(
        employeeCode,
        dto
      );
      res.success = true;
      res.message = `Employee Profile ${UPDATE_SUCCESS}`;
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
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.delete(employeeCode);
      res.success = true;
      res.message = `Employee User ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("updatePassword/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Param("employeeCode") employeeCode: string,
    @Body() dto: UpdateEmployeeUserProfilePasswordDto
  ) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.updatePassword(
        employeeCode,
        dto
      );
      res.success = true;
      res.message = `Employee User password ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("updatePasswordFromAdmin/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async updatePasswordFromAdmin(
    @Param("employeeCode") employeeCode: string,
    @Body() dto: UpdateUserPasswordFromAdminDto
  ) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.updatePasswordFromAdmin(
        employeeCode,
        dto
      );
      res.success = true;
      res.message = `Employee User password ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("approveAccessRequest/:employeeCode")
  //   @UseGuards(JwtAuthGuard)
  async approveAccessRequest(@Param("employeeCode") employeeCode: string) {
    const res: ApiResponseModel<EmployeeUser> = {} as any;
    try {
      res.data = await this.employeeUserService.approveAccessRequest(
        employeeCode
      );
      res.success = true;
      res.message = `Employee User ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
