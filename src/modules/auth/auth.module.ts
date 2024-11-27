import { Module } from "@nestjs/common";
import { AuthService } from "../../services/auth.service";
import { LocalStrategy } from "../../core/auth/local.strategy";
import { JwtStrategy } from "../../core/auth/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/db/entities/Users";
import { Students } from "src/db/entities/Students";
import { Employees } from "src/db/entities/Employees";
import { Operators } from "src/db/entities/Operators";
import { UserEmailVerificationLog } from "src/db/entities/UserEmailVerificationLog";
import { EmailService } from "src/services/email.service";

@Module({
  imports: [
    PassportModule.register({}),
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      Users,
      Students,
      Employees,
      Operators,
      UserEmailVerificationLog,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
