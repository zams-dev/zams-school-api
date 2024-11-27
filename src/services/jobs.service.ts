import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { CronJob, CronTime } from "cron";
import { JOB_STATUS } from "src/common/constant/job.contant";
import { Jobs } from "src/db/entities/Jobs";
import { In, Not, Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JOB_TYPE } from "../common/constant/job.contant";
import moment from "moment";
import { JobTaskService } from "./job-task.service";
import { time } from "console";
import { CustomCacheManagerService } from "./custom-cache-manager.service";
import { normalizeCacheKey } from "src/common/utils/utils";

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Jobs)
    private jobRepository: Repository<Jobs>,
    private jobTaskService: JobTaskService,
    private customCacheManagerService: CustomCacheManagerService
  ) {}

  // Check if a given date is earlier than the current UTC date
  private isDateInPast(date: Date): boolean {
    const nowUtc = moment.utc();
    return moment(date).isBefore(nowUtc);
  }
  // Schedule a job for sending announcements
  async scheduleAnnouncementJob(
    jobReferenceId: string,
    dateTime: Date,
    message: string,
    timezone = "Asia/Manila"
  ): Promise<void> {
    try {
      const cronTime = new CronTime(dateTime, timezone);
      if (!this.isDateInPast(dateTime)) {
        const exist = this.schedulerRegistry.doesExist("cron", jobReferenceId);
        if (exist) {
          const conJob = this.schedulerRegistry.getCronJob(jobReferenceId);
          conJob.stop();
          this.schedulerRegistry.deleteCronJob(jobReferenceId.toString());
        }

        // const cronTime = this.dateToCronExpression(dateTime, timezone);
        const job: CronJob = new CronJob(
          cronTime.source,
          //handling
          () => {
            try {
              this.logger.log(`Running Job: ${jobReferenceId}`);
              this.updateJobStatus(
                jobReferenceId,
                JOB_STATUS.RUNNING,
                JOB_TYPE.ANNOUNCEMENTS_SENDER
              ).then(() => {
                this.jobTaskService.sendAnnouncement(
                  jobReferenceId,
                  this.jobRepository.manager.connection
                );
                job.stop();
                this.logger.log(
                  `job stop with ID ${jobReferenceId} at ${moment()
                    .tz(timezone)
                    .format("YYYY-MM-DD hh:mm A")}`
                );
              });
            } catch (ex) {
              this.updateJobStatus(
                jobReferenceId,
                JOB_STATUS.FAILED,
                JOB_TYPE.ANNOUNCEMENTS_SENDER
              );
              this.logger.error(ex?.message);
              throw ex;
            }
          },
          () => {
            try {
              // Delete the job after it has run
              this.updateJobStatus(
                jobReferenceId.toString(),
                JOB_STATUS.COMPLETED,
                JOB_TYPE.ANNOUNCEMENTS_SENDER
              ).then((res) => {
                const exist = this.schedulerRegistry.doesExist(
                  "cron",
                  jobReferenceId
                );
                if (exist) {
                  this.schedulerRegistry.deleteCronJob(jobReferenceId);
                }
              });
            } catch (ex) {
              this.logger.error(ex?.message);
              throw ex;
            }
          },
          false,
          timezone
        );

        const cacheKey = `jobs_${jobReferenceId}_${
          JOB_TYPE.ANNOUNCEMENTS_SENDER
        }_${JSON.stringify([JOB_STATUS.PENDING])}`;
        let newJob = await this.customCacheManagerService.get<Jobs>(cacheKey);
        if (!newJob) {
          newJob = await this.jobRepository.findOne({
            where: {
              jobReferenceId,
              jobType: JOB_TYPE.ANNOUNCEMENTS_SENDER,
              status: In([JOB_STATUS.PENDING]),
            },
          });
          if (!newJob) {
            newJob = new Jobs();
          }
        } else {
          await this.customCacheManagerService.del(cacheKey);
        }
        newJob.jobType = JOB_TYPE.ANNOUNCEMENTS_SENDER;
        newJob.jobReferenceId = jobReferenceId.toString();
        newJob.jobCronTime = cronTime.source.toString();
        newJob.description = message;

        newJob = await this.jobRepository.save(newJob);

        this.schedulerRegistry.addCronJob(
          jobReferenceId.toString(),
          job as any
        );
        job.start();
        this.logger.log(
          `Scheduled announcement job with ID ${jobReferenceId} at ${cronTime.source}`
        );
      } else {
        await this.updateJobStatus(
          jobReferenceId,
          JOB_STATUS.RUNNING,
          JOB_TYPE.ANNOUNCEMENTS_SENDER
        );
        this.jobTaskService.sendAnnouncement(
          jobReferenceId,
          this.jobRepository.manager.connection
        );
        this.logger.log(
          `job stop with ID ${jobReferenceId} at ${moment()
            .tz(timezone)
            .format("YYYY-MM-DD hh:mm A")}`
        );
        await this.updateJobStatus(
          jobReferenceId,
          JOB_STATUS.COMPLETED,
          JOB_TYPE.ANNOUNCEMENTS_SENDER
        );
      }
    } catch (ex) {
      this.logger.error(ex?.message);
      throw new HttpException(
        `Error scheduling announcement jobs for announcements: #${jobReferenceId} - ${message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async updateJobStatus(
    jobReferenceId: string,
    status: JOB_STATUS,
    jobType: JOB_TYPE
  ): Promise<void> {
    try {
      const jobs = await this.jobRepository.find({
        where: { jobReferenceId, status: Not(status), jobType },
      });
      if (jobs.length > 0) {
        for (const job of jobs) {
          job.status = status;
          await this.jobRepository.save(job);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting job: ${jobReferenceId}`, error);
      throw error;
    }
  }

  async getByJobId(jobId) {
    let job = await this.customCacheManagerService.get<Jobs>(`jobs_jobId_${jobId}`);
    if (!job) {
      job = await this.jobRepository.findOne({ where: { jobId } });
    } else {
      await this.customCacheManagerService.del(`jobs_jobId_${jobId}`);
    }
    await this.customCacheManagerService.set(`jobs_jobId_${jobId}`, job, 300);
    return job;
  }

  async getByType(jobType: JOB_TYPE, status?) {
    const cacheKey = normalizeCacheKey(`jobs_job_type`, {
      jobType,
      status:
        !status || status === ""
          ? In([
              JOB_STATUS.PENDING,
              JOB_STATUS.RUNNING,
              JOB_STATUS.CANCELLED,
              JOB_STATUS.CANCELLED,
              JOB_STATUS.FAILED,
            ])
          : status,
    });
    let job = await this.customCacheManagerService.get<Jobs>(cacheKey);
    if (!job) {
      job = await this.jobRepository.findOne({
        where: {
          jobType,
          status:
            !status || status === ""
              ? In([
                  JOB_STATUS.PENDING,
                  JOB_STATUS.RUNNING,
                  JOB_STATUS.CANCELLED,
                  JOB_STATUS.CANCELLED,
                  JOB_STATUS.FAILED,
                ])
              : status,
        },
      });
    } else {
      await this.customCacheManagerService.del(cacheKey);
    }
    await this.customCacheManagerService.set(cacheKey, job, 300);
    return job;
  }
}
