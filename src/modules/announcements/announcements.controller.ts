import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Headers,
} from "@nestjs/common";
import { ApiBody, ApiHeader, ApiTags } from "@nestjs/swagger";
import { ANNOUNCEMENT_AUDIENCE_TYPE } from "src/common/constant/announcements.constant";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { CreateAnnouncementDto } from "src/core/dto/announcements/announcements.create.dto";
import { UpdateAnnouncementDto } from "src/core/dto/announcements/announcements.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Announcements } from "src/db/entities/Announcements";
import { Employees } from "src/db/entities/Employees";
import { Students } from "src/db/entities/Students";
import { Users } from "src/db/entities/Users";
import { AnnouncementsService } from "src/services/announcements.service";

@ApiTags("announcements")
@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get("/:announcementCode")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  @ApiHeader({
    name: "userCode",
    description: "User code",
  })
  //   @UseGuards(JwtAuthGuard)
  async getDetails(
    @Param("announcementCode") announcementCode: string,
    @Headers("schoolCode") schoolCode = null,
    @Headers("userCode") userCode = null
  ) {
    const res = {} as ApiResponseModel<Announcements>;
    try {
      res.data = await this.announcementsService.getByCode(
        announcementCode,
        schoolCode,
        userCode
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("recipients")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  @ApiBody({
    schema: {
      properties: {
        announcementCode: {
          type: "string",
        },
        audienceType: {
          type: "string",
        },
        filter: {
          type: "object",
        },
      },
      required: ["announcementCode", "audienceType", "filter"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async getAnnouncementRecipients(
    @Headers("schoolCode") schoolCode = null,
    @Body("announcementCode") announcementCode: string,
    @Body("audienceType") audienceType: ANNOUNCEMENT_AUDIENCE_TYPE,
    @Body("filter")
    filter: {
      employeeTitleIds: string[];
      employeeDepartmentIds: string[];
      employeeExcludedIds: string[];
      studentPrimarySYLvlIds: string[];
      studentPrimarySectionIds: string[];
      studentPrimaryExcludedIds: string[];
      studentJuniorSYLvlIds: string[];
      studentJuniorSectionIds: string[];
      studentJuniorExcludedIds: string[];
      studentSeniorSYLvlIds: string[];
      studentSeniorSectionIds: string[];
      studentSeniorExcludedIds: string[];
    } = {
      employeeTitleIds: [],
      employeeDepartmentIds: [],
      employeeExcludedIds: [],
      studentPrimarySYLvlIds: [],
      studentPrimarySectionIds: [],
      studentPrimaryExcludedIds: [],
      studentJuniorSYLvlIds: [],
      studentJuniorSectionIds: [],
      studentJuniorExcludedIds: [],
      studentSeniorSYLvlIds: [],
      studentSeniorSectionIds: [],
      studentSeniorExcludedIds: [],
    }
  ) {
    const res = {} as ApiResponseModel<
      {
        id: string;
        fullName: string;
      }[]
    >;
    try {
      res.data = await this.announcementsService.getAnnouncementRecipients(
        announcementCode,
        audienceType,
        filter,
        schoolCode
      );
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("excluded")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  @ApiBody({
    schema: {
      properties: {
        announcementCode: {
          type: "string",
        },
        audienceType: {
          type: "string",
        },
        filter: {
          type: "object",
        },
      },
      required: ["audienceType", "filter", "announcementCode"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async getAnnouncementExcluded(
    @Headers("schoolCode") schoolCode = null,
    @Body("announcementCode") announcementCode: string,
    @Body("audienceType") audienceType: ANNOUNCEMENT_AUDIENCE_TYPE,
    @Body("filter")
    filter: {
      employeeExcludedIds: string[];
      studentPrimaryExcludedIds: string[];
      studentJuniorExcludedIds: string[];
      studentSeniorExcludedIds: string[];
    } = {
      employeeExcludedIds: [],
      studentPrimaryExcludedIds: [],
      studentJuniorExcludedIds: [],
      studentSeniorExcludedIds: [],
    }
  ) {
    const res = {} as ApiResponseModel<
      {
        id: string;
        fullName: string;
      }[]
    >;
    try {
      res.data = await this.announcementsService.getAnnouncementExcluded(
        announcementCode,
        audienceType,
        filter,
        schoolCode
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
    const res: ApiResponseModel<{ results: Announcements[]; total: number }> =
      {} as any;
    try {
      res.data = await this.announcementsService.getAnnouncementsPagination(
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
  async create(@Body() announcementsDto: CreateAnnouncementDto) {
    const res: ApiResponseModel<Announcements> = {} as any;
    try {
      res.data = await this.announcementsService.create(announcementsDto);
      res.success = true;
      res.message = `Announcements ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:announcementCode")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Headers("schoolCode") schoolCode = null,
    @Param("announcementCode") announcementCode: string,
    @Body() dto: UpdateAnnouncementDto
  ) {
    const res: ApiResponseModel<Announcements> = {} as any;
    try {
      res.data = await this.announcementsService.update(
        announcementCode,
        dto,
        schoolCode
      );
      res.success = true;
      res.message = `Announcements ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("cancel/:announcementCode")
  //   @UseGuards(JwtAuthGuard)
  async cancel(@Param("announcementCode") announcementCode: string) {
    const res: ApiResponseModel<Announcements> = {} as any;
    try {
      res.data = await this.announcementsService.cancel(announcementCode);
      res.success = true;
      res.message = `Announcements Cancelled!`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:announcementCode")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  //   @UseGuards(JwtAuthGuard)
  async delete(
    @Headers("schoolCode") schoolCode = null,
    @Param("announcementCode") announcementCode: string
  ) {
    const res: ApiResponseModel<Announcements> = {} as any;
    try {
      res.data = await this.announcementsService.delete(
        announcementCode,
        schoolCode
      );
      res.success = true;
      res.message = `Announcements ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("resend")
  @ApiHeader({
    name: "schoolCode",
    required: true,
    description: "School code",
  })
  @ApiBody({
    schema: {
      properties: {
        announcementCode: {
          type: "string",
        },
      },
      required: ["announcementCode"],
    },
  })
  //   @UseGuards(JwtAuthGuard)
  async resend(
    @Headers("schoolCode") schoolCode = null,
    @Body("announcementCode") announcementCode: string
  ) {
    const res: ApiResponseModel<Announcements> = {} as any;
    try {
      res.data = await this.announcementsService.resend(
        announcementCode,
        schoolCode
      );
      res.success = true;
      res.message = `Announcements ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
