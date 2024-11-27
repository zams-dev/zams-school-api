import { Module } from "@nestjs/common";
import { EmployeeTitlesController } from "./employee-titles.controller";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { EmployeeTitlesService } from "src/services/employee-titles.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeTitles])],
  controllers: [EmployeeTitlesController],
  providers: [EmployeeTitlesService],
  exports: [EmployeeTitlesService],
})
export class EmployeeTitlesModule {}
