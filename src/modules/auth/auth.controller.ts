/* eslint-disable prettier/prettier */
import { LocalAuthGuard } from "../../core/auth/local.auth.guard";
import {
  Controller,
  Body,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
  Headers,
  Query,
  ValidationPipe,
  BadRequestException,
  Put,
} from "@nestjs/common";
import { AuthService } from "../../services/auth.service";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { LogInDto, LogInOrgDto } from "src/core/dto/auth/login.dto";
import { ApiBody, ApiParam, ApiTags } from "@nestjs/swagger";
import { IsIn, Matches } from "class-validator";
import { REGISTER_SUCCESS, UPDATE_SUCCESS } from "src/common/constant/api-response.constant";
import { RegisterStudentUserDto } from "src/core/dto/auth/register-student.dto";
import { Users } from "src/db/entities/Users";
import { Students } from "src/db/entities/Students";
import { Employees } from "src/db/entities/Employees";
import { Operators } from "src/db/entities/Operators";
import { RegisterEmployeeUserDto } from "src/core/dto/auth/register-employee.dto";
import { RegisterOperatorUserDto } from "src/core/dto/auth/register-operator.dto";
import { RegisterClientUserDto } from "src/core/dto/auth/register-client.dto";
import { ANNOUNCEMENT_AUDIENCE_TYPE } from "src/common/constant/announcements.constant";
import { AUTH_USER_EMAIL_VERIFICATION_TYPE } from "src/common/constant/auth.constant";
import { UserEmailVerificationLog } from "src/db/entities/UserEmailVerificationLog";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { Clients } from "src/db/entities/Clients";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post("register/employeeUser")
  public async registerEmployee(
    @Body()
    dto: RegisterEmployeeUserDto
  ) {
    const res: ApiResponseModel<any> = {} as any;
    try {
      res.data = await this.authService.registerEmployee(
        dto as RegisterEmployeeUserDto
      );
      res.success = true;
      res.message = `${REGISTER_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("register/client")
  public async registerClient(
    @Body()
    dto: RegisterClientUserDto
  ) {
    const res: ApiResponseModel<any> = {} as any;
    try {
      res.data = await this.authService.registerClient(
        dto as RegisterClientUserDto
      );
      res.success = true;
      res.message = `${REGISTER_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("login/operator")
  public async loginOperator(@Body() loginUserDto: LogInDto) {
    const res: ApiResponseModel<any> = {} as ApiResponseModel<any>;
    try {
      res.data = await this.authService.getOperatorsByCredentials(loginUserDto.userName, loginUserDto.password);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("login/employeeUser")
  public async loginEmployeeUser(@Body() loginUserDto: LogInOrgDto) {
    const res: ApiResponseModel<any> = {} as ApiResponseModel<any>;
    try {
      res.data = await this.authService.getEmployeeUserByCredentials(loginUserDto);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("login/client")
  public async loginClient(@Body() loginUserDto: LogInDto) {
    const res: ApiResponseModel<any> = {} as ApiResponseModel<any>;
    try {
      res.data = await this.authService.getClientsByCredentials(loginUserDto.userName, loginUserDto.password);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("sendEmailVerification")
  @ApiBody({
    schema: {
      properties: {
        email: {
          type: "string",
        },
        sessionId : {
          type: "string",
        },
        type : {
          type: "string",
        },
      },
      required: ["email", "sessionId", "type"],
    },
  })
  public async sendEmailVerification(
    @Body("email") email: string,
    @Body("sessionId") sessionId: string,
    @Body("type") type: AUTH_USER_EMAIL_VERIFICATION_TYPE) {
    const res: ApiResponseModel<UserEmailVerificationLog> = {} as any;
    try {
      res.data = await this.authService.sendEmailVerification({ email, sessionId, type});
      res.success = true;
      res.message = `Verification Sent`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("verifyEmail")
  @ApiBody({
    schema: {
      properties: {
        email: {
          type: "string",
        },
        sessionId : {
          type: "string",
        },
        type : {
          type: "string",
        },
        verificationCode : {
          type: "string",
        },
      },
      required: ["email", "sessionId", "type", "verificationCode"],
    },
  })
  public async verifyEmail(
    @Body("email") email: string,
    @Body("sessionId") sessionId: string,
    @Body("type") type: AUTH_USER_EMAIL_VERIFICATION_TYPE,
    @Body("verificationCode") verificationCode: string) {
    const res: ApiResponseModel<boolean> = {} as any;
    try {
      res.data = await this.authService.verifyEmail({ email, sessionId, type, verificationCode});
      res.success = true;
      res.message = `Email verified`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("resetPassword")
  //   @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Body() updateUserResetPasswordDto: UpdateUserResetPasswordDto
  ) {
    const res: ApiResponseModel<Clients> = {} as any;
    try {
      res.data = await this.authService.resetPassword(
        updateUserResetPasswordDto
      );
      res.success = true;
      res.message = `Client password ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
