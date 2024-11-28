import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { Notifications } from "src/db/entities/Notifications";
import { NotificationsService } from "src/services/notifications.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Notifications]),
    CustomCacheManagerModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
