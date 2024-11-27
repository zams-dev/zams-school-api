import { Module } from "@nestjs/common";
import { UserFirebaseTokenController } from "./user-firebase-token.controller";
import { UserFirebaseTokenService } from "src/services/user-firebase-token.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserFirebaseToken } from "src/db/entities/UserFirebaseToken";

@Module({
  imports: [TypeOrmModule.forFeature([UserFirebaseToken])],
  controllers: [UserFirebaseTokenController],
  providers: [UserFirebaseTokenService],
  exports: [UserFirebaseTokenService],
})
export class UserFirebaseTokenModule {}
