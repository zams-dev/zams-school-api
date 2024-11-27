import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OPERATORS_ERROR_NOT_FOUND } from "src/common/constant/operators.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  hash,
} from "src/common/utils/utils";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { CreateOperatorUserDto } from "src/core/dto/operators/operators.create.dto";
import { UpdateOperatorUserDto } from "src/core/dto/operators/operators.update.dto";
import { Operators } from "src/db/entities/Operators";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operators)
    private readonly operatorRepo: Repository<Operators>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.operatorRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          user: true,
        },
        skip,
        take,
        order,
      }),
      this.operatorRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x.user.password;
        return x;
      }),
      total,
    };
  }

  async getByCode(operatorCode) {
    const res = await this.operatorRepo.findOne({
      where: {
        operatorCode,
        active: true,
      },
      relations: {
        user: true,
      },
    });

    if (!res) {
      throw Error(USER_ERROR_USER_NOT_FOUND);
    }
    delete res.user.password;
    return res;
  }

  async create(dto: CreateOperatorUserDto) {
    return await this.operatorRepo.manager.transaction(
      async (entityManager) => {
        let user = new Users();
        user.userType = USER_TYPE.OPERATOR;
        user.userName = dto.userName;
        user.password = await hash(dto.password);
        user = await entityManager.save(Users, user);
        user.userCode = generateIndentityCode(user.userId);
        user = await entityManager.save(Users, user);

        let operator = new Operators();
        operator.user = user;
        operator.name = dto.name;
        operator = await entityManager.save(Operators, operator);
        operator.operatorCode = generateIndentityCode(operator.operatorId);
        operator = await entityManager.save(Operators, operator);
        operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode: operator.operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });
        delete operator.user.password;
        return operator;
      }
    );
  }

  async update(operatorCode, dto: UpdateOperatorUserDto) {
    return await this.operatorRepo.manager.transaction(
      async (entityManager) => {
        let operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });

        if (!operator) {
          throw Error(OPERATORS_ERROR_NOT_FOUND);
        }

        operator.name = dto.name;
        operator = await entityManager.save(Operators, operator);
        operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });
        delete operator.user.password;
        return operator;
      }
    );
  }

  async resetPassword(operatorCode, dto: UpdateUserResetPasswordDto) {
    return await this.operatorRepo.manager.transaction(
      async (entityManager) => {
        let operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });

        if (!operator) {
          throw Error(OPERATORS_ERROR_NOT_FOUND);
        }

        const user = operator.user;
        user.password = await hash(dto.password);
        await entityManager.save(Users, user);
        operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });
        delete operator.user.password;
        return operator;
      }
    );
  }

  async delete(operatorCode) {
    return await this.operatorRepo.manager.transaction(
      async (entityManager) => {
        let operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });

        if (!operator) {
          throw Error(OPERATORS_ERROR_NOT_FOUND);
        }

        operator.active = false;
        await entityManager.save(Operators, operator);
        const user = operator.user;
        user.active = false;
        await entityManager.save(Users, user);
        operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
          },
          relations: {
            user: true,
          },
        });
        delete operator.user.password;
        return operator;
      }
    );
  }

  async approveAccessRequest(operatorCode) {
    return await this.operatorRepo.manager.transaction(
      async (entityManager) => {
        let operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
            active: true,
          },
          relations: {
            user: true,
          },
        });

        if (!operator) {
          throw Error(OPERATORS_ERROR_NOT_FOUND);
        }

        await entityManager.save(Operators, operator);
        operator = await entityManager.findOne(Operators, {
          where: {
            operatorCode,
          },
          relations: {
            user: true,
          },
        });
        delete operator.user.password;
        return operator;
      }
    );
  }
}
