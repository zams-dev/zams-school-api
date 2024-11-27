import { Module } from "@nestjs/common";
import { AnnouncementsController } from "./announcements.controller";
import { Announcements } from "src/db/entities/Announcements";
import { AnnouncementsService } from "src/services/announcements.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JobsService } from "src/services/jobs.service";
import { Jobs } from "src/db/entities/Jobs";
import { JobTaskService } from "src/services/job-task.service";
import { HttpModule } from "@nestjs/axios";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { AnnouncementVisitLogs } from "src/db/entities/AnnouncementVisitLogs";
import { Users } from "src/db/entities/Users";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Announcements,
      Jobs,
      AnnouncementVisitLogs,
      Users,
    ]),
    CustomCacheManagerModule,
  ],
  controllers: [AnnouncementsController],
  providers: [
    AnnouncementsService,
    JobsService,
    JobTaskService,
    OneSignalNotificationService,
  ],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
