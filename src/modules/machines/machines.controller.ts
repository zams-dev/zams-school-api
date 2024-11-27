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
import { CreateMachineDto } from "src/core/dto/machines/machines.create.dto";
import { UpdateMachineDto } from "src/core/dto/machines/machines.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Machines } from "src/db/entities/Machines";
import { MachinesService } from "src/services/machines.service";

@ApiTags("machines")
@Controller("machines")
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get("/:machineCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("machineCode") machineCode: string) {
    const res = {} as ApiResponseModel<Machines>;
    try {
      res.data = await this.machinesService.getByCode(machineCode);
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
    const res: ApiResponseModel<{ results: Machines[]; total: number }> =
      {} as any;
    try {
      res.data = await this.machinesService.getMachinesPagination(params);
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
  async create(@Body() machinesDto: CreateMachineDto) {
    const res: ApiResponseModel<Machines> = {} as any;
    try {
      res.data = await this.machinesService.create(machinesDto);
      res.success = true;
      res.message = `Machines ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
  @ApiBody({
    isArray: true,
    type: CreateMachineDto,
  })
  @Post("batchCreate")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() machinesDto: CreateMachineDto[]) {
    const res: ApiResponseModel<Machines[]> = {} as any;
    try {
      res.data = await this.machinesService.batchCreate(machinesDto);
      res.success = true;
      res.message = `Machines ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:machineCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("machineCode") machineCode: string,
    @Body() dto: UpdateMachineDto
  ) {
    const res: ApiResponseModel<Machines> = {} as any;
    try {
      res.data = await this.machinesService.update(machineCode, dto);
      res.success = true;
      res.message = `Machines ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:machineCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("machineCode") machineCode: string) {
    const res: ApiResponseModel<Machines> = {} as any;
    try {
      res.data = await this.machinesService.delete(machineCode);
      res.success = true;
      res.message = `Machines ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
