import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "src/services/attendance.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Students } from "src/db/entities/Students";
import { EmployeesService } from "src/services/employees.service";
import { StudentsService } from "src/services/students.service";
import { Employees } from "src/db/entities/Employees";

@Module({
  imports: [TypeOrmModule.forFeature([Students, Employees])],
  controllers: [AttendanceController],
  providers: [AttendanceService, EmployeesService, StudentsService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
