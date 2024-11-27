import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EMPLOYEEUSERACCESS_ERROR_NOT_FOUND } from "src/common/constant/employee-user-access.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateEmployeeUserAccessDto } from "src/core/dto/employee-user-access/employee-user-access.create.dto";
import { UpdateEmployeeUserAccessDto } from "src/core/dto/employee-user-access/employee-user-access.update.dto";
import { EmployeeUserAccess } from "src/db/entities/EmployeeUserAccess";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class EmployeeUserAccessService {
  constructor(
    @InjectRepository(EmployeeUserAccess)
    private readonly employeeUserAccessRepo: Repository<EmployeeUserAccess>
  ) {}

  async getEmployeeUserAccessPagination({
    pageSize,
    pageIndex,
    order,
    columnDef,
  }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.employeeUserAccessRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.employeeUserAccessRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x.createdByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
  }

  async getByCode(employeeUserAccessCode) {
    const result = await this.employeeUserAccessRepo.findOne({
      where: {
        employeeUserAccessCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateEmployeeUserAccessDto) {
    return await this.employeeUserAccessRepo.manager.transaction(
      async (entityManager) => {
        let employeeUserAccess = new EmployeeUserAccess();
        employeeUserAccess.name = dto.name;
        employeeUserAccess.accessPages = dto.accessPages;

        const school = await entityManager.findOne(Schools, {
          where: {
            schoolId: dto.schoolId,
            active: true,
          },
        });
        if (!school) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }
        employeeUserAccess.school = school;

        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeUserAccess.createdDate = timestamp;
        const createdByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.createdByUserId,
            active: true,
          },
        });
        if (!createdByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        employeeUserAccess.createdByUser = createdByUser;
        employeeUserAccess = await entityManager.save(employeeUserAccess);
        employeeUserAccess.employeeUserAccessCode = generateIndentityCode(
          employeeUserAccess.employeeUserAccessId
        );
        employeeUserAccess = await entityManager.save(
          EmployeeUserAccess,
          employeeUserAccess
        );
        delete employeeUserAccess.createdByUser.password;
        return employeeUserAccess;
      }
    );
  }

  async update(employeeUserAccessCode, dto: UpdateEmployeeUserAccessDto) {
    return await this.employeeUserAccessRepo.manager.transaction(
      async (entityManager) => {
        let employeeUserAccess = await entityManager.findOne(
          EmployeeUserAccess,
          {
            where: {
              employeeUserAccessCode,
              active: true,
            },
          }
        );
        if (!employeeUserAccess) {
          throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
        }
        employeeUserAccess.name = dto.name;
        employeeUserAccess.accessPages = dto.accessPages;
        const updatedByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.updatedByUserId,
            active: true,
          },
        });
        if (!updatedByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        employeeUserAccess.updatedByUser = updatedByUser;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeUserAccess.updatedDate = timestamp;
        employeeUserAccess = await entityManager.save(
          EmployeeUserAccess,
          employeeUserAccess
        );
        if (employeeUserAccess?.createdByUser?.password) {
          delete employeeUserAccess.createdByUser.password;
        }
        if (employeeUserAccess?.updatedByUser?.password) {
          delete employeeUserAccess.updatedByUser.password;
        }
        return employeeUserAccess;
      }
    );
  }

  async delete(employeeUserAccessCode) {
    return await this.employeeUserAccessRepo.manager.transaction(
      async (entityManager) => {
        let employeeUserAccess = await entityManager.findOne(
          EmployeeUserAccess,
          {
            where: {
              employeeUserAccessCode,
              active: true,
            },
          }
        );
        if (!employeeUserAccess) {
          throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
        }
        employeeUserAccess.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeUserAccess.updatedDate = timestamp;
        employeeUserAccess = await entityManager.save(
          EmployeeUserAccess,
          employeeUserAccess
        );
        if (employeeUserAccess?.createdByUser?.password) {
          delete employeeUserAccess.createdByUser.password;
        }
        if (employeeUserAccess?.updatedByUser?.password) {
          delete employeeUserAccess.updatedByUser.password;
        }
        return employeeUserAccess;
      }
    );
  }
}
