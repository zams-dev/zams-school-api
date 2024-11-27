import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "src/services/jobs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Announcements } from "src/db/entities/Announcements";
import { Jobs } from "src/db/entities/Jobs";
import { ScheduleModule } from "@nestjs/schedule";
import { JobTaskService } from "src/services/job-task.service";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { HttpModule } from "@nestjs/axios";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Announcements, Jobs]),
    CustomCacheManagerModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobTaskService, OneSignalNotificationService],
  exports: [JobsService],
})
export class JobsModule {}
