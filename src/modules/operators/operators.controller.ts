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
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { CreateOperatorUserDto } from "src/core/dto/operators/operators.create.dto";
import { UpdateOperatorUserDto } from "src/core/dto/operators/operators.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Operators } from "src/db/entities/Operators";
import { OperatorsService } from "src/services/operators.service";

@ApiTags("operators")
@Controller("operators")
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get("/:operatorCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("operatorCode") operatorCode: string) {
    const res = {} as ApiResponseModel<Operators>;
    try {
      res.data = await this.operatorsService.getByCode(operatorCode);
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
    const res: ApiResponseModel<{ results: Operators[]; total: number }> =
      {} as any;
    try {
      res.data = await this.operatorsService.getPagination(params);
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
  async create(@Body() params: CreateOperatorUserDto) {
    const res: ApiResponseModel<Operators> = {} as any;
    try {
      res.data = await this.operatorsService.create(params);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:operatorCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("operatorCode") operatorCode: string,
    @Body() dto: UpdateOperatorUserDto
  ) {
    const res: ApiResponseModel<Operators> = {} as any;
    try {
      res.data = await this.operatorsService.update(operatorCode, dto);
      res.success = true;
      res.message = `Operator ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("resetPassword/:operatorCode")
  //   @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Param("operatorCode") operatorCode: string,
    @Body() dto: UpdateUserResetPasswordDto
  ) {
    const res: ApiResponseModel<Operators> = {} as any;
    try {
      res.data = await this.operatorsService.resetPassword(operatorCode, dto);
      res.success = true;
      res.message = `Operator password ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("approveAccessRequest/:operatorCode")
  //   @UseGuards(JwtAuthGuard)
  async approveAccessRequest(@Param("operatorCode") operatorCode: string) {
    const res: ApiResponseModel<Operators> = {} as any;
    try {
      res.data = await this.operatorsService.approveAccessRequest(operatorCode);
      res.success = true;
      res.message = `Operator ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:operatorCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("operatorCode") operatorCode: string) {
    const res: ApiResponseModel<Operators> = {} as any;
    try {
      res.data = await this.operatorsService.delete(operatorCode);
      res.success = true;
      res.message = `Operator ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
