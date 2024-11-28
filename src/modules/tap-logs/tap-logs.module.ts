import { Module } from "@nestjs/common";
import { TapLogsController } from "./tap-logs.controller";
import { TapLogs } from "src/db/entities/TapLogs";
import { TapLogsService } from "src/services/tap-logs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { FirebaseCloudMessagingService } from "src/services/firebase-cloud-messaging.service";
import { HttpModule } from "@nestjs/axios";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";


@Module({
  imports: [
    FirebaseProviderModule,
    HttpModule,
    TypeOrmModule.forFeature([TapLogs]),
    CustomCacheManagerModule
  ],
  controllers: [TapLogsController],
  providers: [
    TapLogsService,
    FirebaseCloudMessagingService,
    OneSignalNotificationService,
  ],
  exports: [
    TapLogsService,
    FirebaseCloudMessagingService,
    OneSignalNotificationService,
  ],
})
export class TapLogsModule {}
