import { Module } from "@nestjs/common";
import { DepartmentsController } from "./departments.controller";
import { Departments } from "src/db/entities/Departments";
import { DepartmentsService } from "src/services/departments.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Departments])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
