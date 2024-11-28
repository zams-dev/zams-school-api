import { Module } from "@nestjs/common";
import { LinkStudentRequestController } from "./link-student-request.controller";
import { LinkStudentRequestService } from "src/services/link-student-request.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinkStudentRequest } from "src/db/entities/LinkStudentRequest";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { HttpModule } from "@nestjs/axios";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    FirebaseProviderModule,
    HttpModule,
    TypeOrmModule.forFeature([LinkStudentRequest]),
    CustomCacheManagerModule,
  ],
  controllers: [LinkStudentRequestController],
  providers: [LinkStudentRequestService, OneSignalNotificationService],
  exports: [LinkStudentRequestService, OneSignalNotificationService],
})
export class LinkStudentRequestModule {}
