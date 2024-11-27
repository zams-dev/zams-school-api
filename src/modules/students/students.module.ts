import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { Students } from "src/db/entities/Students";
import { StudentsService } from "src/services/students.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Students])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
