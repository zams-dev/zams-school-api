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
import { CreateCourseDto } from "src/core/dto/courses/courses.create.dto";
import { UpdateCourseDto } from "src/core/dto/courses/courses.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Courses } from "src/db/entities/Courses";
import { CoursesService } from "src/services/courses.service";

@ApiTags("courses")
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get("/:courseCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("courseCode") courseCode: string) {
    const res = {} as ApiResponseModel<Courses>;
    try {
      res.data = await this.coursesService.getByCode(courseCode);
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
    const res: ApiResponseModel<{ results: Courses[]; total: number }> =
      {} as any;
    try {
      res.data = await this.coursesService.getCoursesPagination(params);
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
  async create(@Body() coursesDto: CreateCourseDto) {
    const res: ApiResponseModel<Courses> = {} as any;
    try {
      res.data = await this.coursesService.create(coursesDto);
      res.success = true;
      res.message = `Courses ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:courseCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("courseCode") courseCode: string,
    @Body() dto: UpdateCourseDto
  ) {
    const res: ApiResponseModel<Courses> = {} as any;
    try {
      res.data = await this.coursesService.update(courseCode, dto);
      res.success = true;
      res.message = `Courses ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:courseCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("courseCode") courseCode: string) {
    const res: ApiResponseModel<Courses> = {} as any;
    try {
      res.data = await this.coursesService.delete(courseCode);
      res.success = true;
      res.message = `Courses ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
