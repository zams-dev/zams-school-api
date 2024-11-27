import { Module } from "@nestjs/common";
import { SectionsController } from "./sections.controller";
import { Sections } from "src/db/entities/Sections";
import { SectionsService } from "src/services/sections.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Sections])],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
