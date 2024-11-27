import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
export class GetUserDto {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;
}
export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): GetUserDto => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  }
);
