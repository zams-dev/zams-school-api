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
import { CreateStrandDto } from "src/core/dto/strands/strands.create.dto";
import { UpdateStrandDto } from "src/core/dto/strands/strands.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Strands } from "src/db/entities/Strands";
import { StrandsService } from "src/services/strands.service";

@ApiTags("strands")
@Controller("strands")
export class StrandsController {
  constructor(private readonly strandsService: StrandsService) {}

  @Get("/:strandCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("strandCode") strandCode: string) {
    const res = {} as ApiResponseModel<Strands>;
    try {
      res.data = await this.strandsService.getByCode(strandCode);
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
    const res: ApiResponseModel<{ results: Strands[]; total: number }> =
      {} as any;
    try {
      res.data = await this.strandsService.getStrandsPagination(params);
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
  async create(@Body() strandsDto: CreateStrandDto) {
    const res: ApiResponseModel<Strands> = {} as any;
    try {
      res.data = await this.strandsService.create(strandsDto);
      res.success = true;
      res.message = `Strands ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:strandCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("strandCode") strandCode: string,
    @Body() dto: UpdateStrandDto
  ) {
    const res: ApiResponseModel<Strands> = {} as any;
    try {
      res.data = await this.strandsService.update(strandCode, dto);
      res.success = true;
      res.message = `Strands ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:strandCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("strandCode") strandCode: string) {
    const res: ApiResponseModel<Strands> = {} as any;
    try {
      res.data = await this.strandsService.delete(strandCode);
      res.success = true;
      res.message = `Strands ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
