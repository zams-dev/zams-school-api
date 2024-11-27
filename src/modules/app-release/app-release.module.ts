import { Module } from "@nestjs/common";
import { AppReleaseController } from "./app-release.controller";
import { AppRelease } from "src/db/entities/AppRelease";
import { AppReleaseService } from "src/services/app-release.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([AppRelease])],
  controllers: [AppReleaseController],
  providers: [AppReleaseService],
  exports: [AppReleaseService],
})
export class AppReleaseModule {}
