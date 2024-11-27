import { Module } from "@nestjs/common";
import { OperatorsController } from "./operators.controller";
import { Operators } from "src/db/entities/Operators";
import { OperatorsService } from "src/services/operators.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Operators])],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
