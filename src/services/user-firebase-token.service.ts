import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_FIREBASE_TOKEN_ERROR_USER_NOT_FOUND } from "src/common/constant/user-firebase-token.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateUserFirebaseTokenDto } from "src/core/dto/user-firebase-token/user-firebase-token.create.dto";
import { UpdateUserFirebaseTokenDto } from "src/core/dto/user-firebase-token/user-firebase-token.update.dto";
import { Schools } from "src/db/entities/Schools";
import { UserFirebaseToken } from "src/db/entities/UserFirebaseToken";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class UserFirebaseTokenService {
  constructor(
    @InjectRepository(UserFirebaseToken)
    private readonly ueserFirebaseTokensRepo: Repository<UserFirebaseToken>
  ) {}

  async getByUserDevice(userId, device) {
    const result = await this.ueserFirebaseTokensRepo.findOne({
      where: {
        user: {
          userId,
        },
        device,
      },
      relations: {
        user: true,
      },
    });
    if (!result) {
      throw Error(USER_FIREBASE_TOKEN_ERROR_USER_NOT_FOUND);
    }
    if (result?.user?.password) {
      delete result.user.password;
    }
    return result;
  }

  async create(dto: CreateUserFirebaseTokenDto) {
    return await this.ueserFirebaseTokensRepo.manager.transaction(
      async (entityManager) => {
        let userFirebaseTokens = await entityManager.findOne(
          UserFirebaseToken,
          {
            where: {
              user: {
                userId: dto.userId,
              },
              device: dto.device,
            },
            relations: {
              user: true,
            },
          }
        );
        if (!userFirebaseTokens) {
          userFirebaseTokens = new UserFirebaseToken();

          const user = await entityManager.findOne(Users, {
            where: {
              userId: dto.userId,
              active: true,
            },
          });
          if (!user) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          userFirebaseTokens.user = user;
          userFirebaseTokens.device = dto.device;
        }

        userFirebaseTokens.firebaseToken = dto.firebaseToken;

        userFirebaseTokens = await entityManager.save(
          UserFirebaseToken,
          userFirebaseTokens
        );
        delete userFirebaseTokens.user.password;
        return userFirebaseTokens;
      }
    );
  }
}
