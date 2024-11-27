import { Module } from "@nestjs/common";
import { EmployeesController } from "./employees.controller";
import { Employees } from "src/db/entities/Employees";
import { EmployeesService } from "src/services/employees.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeUser } from "src/db/entities/EmployeeUser";

@Module({
  imports: [TypeOrmModule.forFeature([Employees, EmployeeUser])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
