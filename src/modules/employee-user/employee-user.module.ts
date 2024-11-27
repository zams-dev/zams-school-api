import { Module } from "@nestjs/common";
import { EmployeeUserController } from "./employee-user.controller";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { EmployeeUserService } from "src/services/employee-user.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeUser])],
  controllers: [EmployeeUserController],
  providers: [EmployeeUserService],
  exports: [EmployeeUserService],
})
export class EmployeeUserModule {}
