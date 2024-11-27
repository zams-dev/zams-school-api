import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Clients } from "src/db/entities/Clients";
import { Students } from "src/db/entities/Students";
import { Users } from "src/db/entities/Users";
import { DashboardClientController } from "./dashboard-client.controller";
import { DashboardClientService } from "src/services/dashboard-client.service";
import { Announcements } from "src/db/entities/Announcements";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Students, Clients, Announcements]),
    CustomCacheManagerModule,
  ],
  controllers: [DashboardClientController],
  providers: [DashboardClientService],
  exports: [DashboardClientService],
})
export class DashboardClientModule {}
