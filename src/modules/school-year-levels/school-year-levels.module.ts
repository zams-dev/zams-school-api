import { Module } from "@nestjs/common";
import { SchoolYearLevelsController } from "./school-year-levels.controller";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { SchoolYearLevelsService } from "src/services/school-year-levels.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([SchoolYearLevels])],
  controllers: [SchoolYearLevelsController],
  providers: [SchoolYearLevelsService],
  exports: [SchoolYearLevelsService],
})
export class SchoolYearLevelsModule {}
