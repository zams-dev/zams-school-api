import { Module } from "@nestjs/common";
import { SchoolsController } from "./schools.controller";
import { Schools } from "src/db/entities/Schools";
import { SchoolsService } from "src/services/schools.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Schools])],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
