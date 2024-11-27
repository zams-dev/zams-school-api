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
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
  DELETE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { CreateLinkStudentRequestDto } from "src/core/dto/link-student-request/link-student-request.create.dto";
import { UnLinkedStudentDto, UpdateLinkStudentRequestDto, VerifyStudentRequestDto } from "src/core/dto/link-student-request/link-student-request.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { LinkStudentRequest } from "src/db/entities/LinkStudentRequest";
import { Students } from "src/db/entities/Students";
import { LinkStudentRequestService } from "src/services/link-student-request.service";

@ApiTags("link-student-request")
@Controller("link-student-request")
export class LinkStudentRequestController {
  constructor(
    private readonly linkStudentRequestService: LinkStudentRequestService
  ) {}

  @Get("/:linkStudentRequestCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(
    @Param("linkStudentRequestCode") linkStudentRequestCode: string
  ) {
    const res = {} as ApiResponseModel<LinkStudentRequest>;
    try {
      res.data = await this.linkStudentRequestService.getByCode(
        linkStudentRequestCode
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
      results: LinkStudentRequest[];
      total: number;
    }> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.getPagination(params);
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
  async create(@Body() linkStudentRequestDto: CreateLinkStudentRequestDto) {
    const res: ApiResponseModel<LinkStudentRequest> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.create(
        linkStudentRequestDto
      );
      res.success = true;
      res.message = `Link Student Request ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("approve/:linkStudentRequestCode")
  //   @UseGuards(JwtAuthGuard)
  async approve(
    @Param("linkStudentRequestCode") linkStudentRequestCode: string,
    @Body() dto: UpdateLinkStudentRequestDto
  ) {
    const res: ApiResponseModel<LinkStudentRequest> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.approve(
        linkStudentRequestCode,
        dto
      );
      res.success = true;
      res.message = `Link Student Request ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("reject/:linkStudentRequestCode")
  //   @UseGuards(JwtAuthGuard)
  async reject(
    @Param("linkStudentRequestCode") linkStudentRequestCode: string,
    @Body() dto: UpdateLinkStudentRequestDto
  ) {
    const res: ApiResponseModel<LinkStudentRequest> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.reject(
        linkStudentRequestCode,
        dto
      );
      res.success = true;
      res.message = `Link Student Request ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("cancel/:linkStudentRequestCode")
  //   @UseGuards(JwtAuthGuard)
  async cancel(
    @Param("linkStudentRequestCode") linkStudentRequestCode: string,
    @Body() dto: UpdateLinkStudentRequestDto
  ) {
    const res: ApiResponseModel<LinkStudentRequest> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.cancel(
        linkStudentRequestCode,
        dto
      );
      res.success = true;
      res.message = `Link Student Request ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("unlinkStudent")
  //   @UseGuards(JwtAuthGuard)
  async unlinkStudent(@Body() dto: UnLinkedStudentDto) {
    const res: ApiResponseModel<Students> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.unlinkStudent(dto);
      res.success = true;
      res.message = `Student was removed successfully!`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("verify/:linkStudentRequestCode")
  //   @UseGuards(JwtAuthGuard)
  async verify(
    @Param("linkStudentRequestCode") linkStudentRequestCode: string,
    @Body() dto: VerifyStudentRequestDto
  ) {
    const res: ApiResponseModel<LinkStudentRequest> = {} as any;
    try {
      res.data = await this.linkStudentRequestService.verify(
        linkStudentRequestCode,
        dto
      );
      res.success = true;
      res.message = `Link Student Verified Successfully!`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
