import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JOB_STATUS, JOB_TYPE } from "src/common/constant/job.contant";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Jobs } from "src/db/entities/Jobs";
import { JobsService } from "src/services/jobs.service";

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get("/:jobId")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("jobId") jobId: string) {
    const res = {} as ApiResponseModel<Jobs>;
    try {
      res.data = await this.jobsService.getByJobId(jobId);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("getByType/:jobType")
  @ApiParam({ name: "jobType", required: false, type: String, enum: JOB_TYPE })
  @ApiQuery({ name: "status", required: false, type: String, enum: JOB_STATUS })
  //   @UseGuards(JwtAuthGuard)
  async getByType(
    @Param("jobType") jobType: JOB_TYPE,
    @Query("status") status: JOB_STATUS
  ) {
    const res = {} as ApiResponseModel<Jobs>;
    try {
      res.data = await this.jobsService.getByType(jobType, status);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
