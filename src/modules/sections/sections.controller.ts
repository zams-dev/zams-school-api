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
  BatchCreateSectionDto,
  CreateSectionDto,
} from "src/core/dto/sections/sections.create.dto";
import { UpdateSectionDto } from "src/core/dto/sections/sections.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Sections } from "src/db/entities/Sections";
import { SectionsService } from "src/services/sections.service";

@ApiTags("sections")
@Controller("sections")
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get("/:sectionCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("sectionCode") sectionCode: string) {
    const res = {} as ApiResponseModel<Sections>;
    try {
      res.data = await this.sectionsService.getByCode(sectionCode);
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
    const res: ApiResponseModel<{ results: Sections[]; total: number }> =
      {} as any;
    try {
      res.data = await this.sectionsService.getSectionsPagination(params);
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
  async create(@Body() sectionsDto: CreateSectionDto) {
    const res: ApiResponseModel<Sections> = {} as any;
    try {
      res.data = await this.sectionsService.create(sectionsDto);
      res.success = true;
      res.message = `Sections ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: BatchCreateSectionDto,
  })
  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async batchCreate(@Body() dtos: BatchCreateSectionDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.sectionsService.batchCreate(dtos);
      res.success = true;
      res.message = `Sections Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:sectionCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("sectionCode") sectionCode: string,
    @Body() dto: UpdateSectionDto
  ) {
    const res: ApiResponseModel<Sections> = {} as any;
    try {
      res.data = await this.sectionsService.update(sectionCode, dto);
      res.success = true;
      res.message = `Sections ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:sectionCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("sectionCode") sectionCode: string) {
    const res: ApiResponseModel<Sections> = {} as any;
    try {
      res.data = await this.sectionsService.delete(sectionCode);
      res.success = true;
      res.message = `Sections ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
