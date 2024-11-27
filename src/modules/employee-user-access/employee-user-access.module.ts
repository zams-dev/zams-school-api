import { Module } from "@nestjs/common";
import { EmployeeUserAccessController } from "./employee-user-access.controller";
import { EmployeeUserAccess } from "src/db/entities/EmployeeUserAccess";
import { EmployeeUserAccessService } from "src/services/employee-user-access.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeUserAccess])],
  controllers: [EmployeeUserAccessController],
  providers: [EmployeeUserAccessService],
  exports: [EmployeeUserAccessService],
})
export class EmployeeUserAccessModule {}
