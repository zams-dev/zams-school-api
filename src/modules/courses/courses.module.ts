import { Module } from "@nestjs/common";
import { CoursesController } from "./courses.controller";
import { Courses } from "src/db/entities/Courses";
import { CoursesService } from "src/services/courses.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Schools } from "src/db/entities/Schools";

@Module({
  imports: [TypeOrmModule.forFeature([Courses])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
