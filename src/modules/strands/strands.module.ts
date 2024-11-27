import { Module } from "@nestjs/common";
import { StrandsController } from "./strands.controller";
import { Strands } from "src/db/entities/Strands";
import { StrandsService } from "src/services/strands.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Strands])],
  controllers: [StrandsController],
  providers: [StrandsService],
  exports: [StrandsService],
})
export class StrandsModule {}
