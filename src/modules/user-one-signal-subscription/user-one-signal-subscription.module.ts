import { Module } from "@nestjs/common";
import { UserOneSignalSubscriptionController } from "./user-one-signal-subscription.controller";
import { UserOneSignalSubscriptionService } from "src/services/user-one-signal-subscription.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserOneSignalSubscription } from "src/db/entities/UserOneSignalSubscription";
import { PusherService } from "src/services/pusher.service";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([UserOneSignalSubscription])],
  controllers: [UserOneSignalSubscriptionController],
  providers: [
    UserOneSignalSubscriptionService,
    PusherService,
    OneSignalNotificationService,
  ],
  exports: [
    UserOneSignalSubscriptionService,
    PusherService,
    OneSignalNotificationService,
  ],
})
export class UserOneSignalSubscriptionModule {}
