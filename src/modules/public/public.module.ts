import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";

@Module({
  controllers: [PublicController],
  providers: [],
})
export class PublicModule {}
