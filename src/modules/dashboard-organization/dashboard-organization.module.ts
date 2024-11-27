import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/db/entities/Users";
import { Students } from "src/db/entities/Students";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { Employees } from "src/db/entities/Employees";
import { DashboardOrganizationController } from "./dashboard-organization.controller";
import { DashboardOrganizationService } from "src/services/dashboard-organization.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Students, Employees, EmployeeUser]),
  ],
  controllers: [DashboardOrganizationController],
  providers: [DashboardOrganizationService],
  exports: [DashboardOrganizationService],
})
export class DashboardOrganizationModule {}
