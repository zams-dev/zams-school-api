import { Module } from "@nestjs/common";
import { MachinesController } from "./machines.controller";
import { Machines } from "src/db/entities/Machines";
import { MachinesService } from "src/services/machines.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Machines])],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
