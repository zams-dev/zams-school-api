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
  CreateStudentDto,
  CreateStudentUserDto,
} from "src/core/dto/students/students.create.dto";
import {
  UpdateStudentDto,
  UpdateStudentUserDto,
  UpdateStudentUserProfileDto,
} from "src/core/dto/students/students.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Students } from "src/db/entities/Students";
import { StudentsService } from "src/services/students.service";
import { BatchCreateStudentDto } from "src/core/dto/students/students.batch-create.dto";

@ApiTags("students")
@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get("/:studentCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("studentCode") studentCode: string) {
    const res = {} as ApiResponseModel<Students>;
    try {
      res.data = await this.studentsService.getByCode(studentCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getByOrgStudentId/:orgStudentId")
  //   @UseGuards(JwtAuthGuard)
  async getByOrgStudentId(@Param("orgStudentId") orgStudentId: string) {
    const res = {} as ApiResponseModel<Students>;
    try {
      res.data = await this.studentsService.getByOrgStudentId(orgStudentId);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getByCardNumber/:cardNumber")
  //   @UseGuards(JwtAuthGuard)
  async getByCardNumber(@Param("cardNumber") cardNumber: string) {
    const res = {} as ApiResponseModel<Students>;
    try {
      res.data = await this.studentsService.getByCardNumber(cardNumber);
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
    const res: ApiResponseModel<{ results: Students[]; total: number }> =
      {} as any;
    try {
      res.data = await this.studentsService.getPagination(params);
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
  async create(@Body() studentsDto: CreateStudentDto) {
    const res: ApiResponseModel<Students> = {} as any;
    try {
      res.data = await this.studentsService.create(studentsDto);
      res.success = true;
      res.message = `Student ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @ApiBody({
    isArray: true,
    type: BatchCreateStudentDto,
  })
  @Post("createBatch")
  //   @UseGuards(JwtAuthGuard)
  async createBatch(@Body() studentDtos: BatchCreateStudentDto[]) {
    const res: ApiResponseModel<{
      success: any[];
      failed: any[];
      warning: any[];
    }> = {} as any;
    try {
      res.data = await this.studentsService.createBatch(studentDtos);
      res.success = true;
      res.message = `Student Batch Create Complete`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:studentCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("studentCode") studentCode: string,
    @Body() dto: UpdateStudentDto
  ) {
    const res: ApiResponseModel<Students> = {} as any;
    try {
      res.data = await this.studentsService.update(studentCode, dto);
      res.success = true;
      res.message = `Student ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  // @Put("updateProfile/:studentCode")
  // //   @UseGuards(JwtAuthGuard)
  // async updateProfile(
  //   @Param("studentCode") studentCode: string,
  //   @Body() dto: UpdateStudentUserProfileDto
  // ) {
  //   const res: ApiResponseModel<Students> = {} as any;
  //   try {
  //     res.data = await this.studentsService.updateProfile(studentCode, dto);
  //     res.success = true;
  //     res.message = `Student ${UPDATE_SUCCESS}`;
  //     return res;
  //   } catch (e) {
  //     res.success = false;
  //     res.message = e.message !== undefined ? e.message : e;
  //     return res;
  //   }
  // }

  @Put("approveAccessRequest/:studentCode")
  //   @UseGuards(JwtAuthGuard)
  async approveAccessRequest(@Param("studentCode") studentCode: string) {
    const res: ApiResponseModel<Students> = {} as any;
    try {
      res.data = await this.studentsService.approveAccessRequest(studentCode);
      res.success = true;
      res.message = `Student ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:studentCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("studentCode") studentCode: string) {
    const res: ApiResponseModel<Students> = {} as any;
    try {
      res.data = await this.studentsService.delete(studentCode);
      res.success = true;
      res.message = `Student ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
