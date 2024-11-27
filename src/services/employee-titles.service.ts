import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EMPLOYEETITLES_ERROR_NOT_FOUND } from "src/common/constant/employee-titles.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import {
  BatchCreateEmployeeTitleDto,
  CreateEmployeeTitleDto,
} from "src/core/dto/employee-titles/employee-titles.create.dto";
import { UpdateEmployeeTitleDto } from "src/core/dto/employee-titles/employee-titles.update.dto";
import { Departments } from "src/db/entities/Departments";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class EmployeeTitlesService {
  constructor(
    @InjectRepository(EmployeeTitles)
    private readonly employeeTitlesRepo: Repository<EmployeeTitles>
  ) {}

  async getEmployeeTitlesPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.employeeTitlesRepo.find({
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
      this.employeeTitlesRepo.count({
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

  async getByCode(employeeTitleCode) {
    const result = await this.employeeTitlesRepo.findOne({
      where: {
        employeeTitleCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(EMPLOYEETITLES_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateEmployeeTitleDto) {
    return await this.employeeTitlesRepo.manager.transaction(
      async (entityManager) => {
        let employeeTitles = new EmployeeTitles();
        employeeTitles.name = dto.name;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeTitles.createdDate = timestamp;

        const school = await entityManager.findOne(Schools, {
          where: {
            schoolId: dto.schoolId,
            active: true,
          },
        });
        if (!school) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }
        employeeTitles.school = school;

        const createdByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.createdByUserId,
            active: true,
          },
        });
        if (!createdByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        employeeTitles.createdByUser = createdByUser;
        employeeTitles = await entityManager.save(employeeTitles);
        employeeTitles.employeeTitleCode = generateIndentityCode(
          employeeTitles.employeeTitleId
        );
        employeeTitles = await entityManager.save(
          EmployeeTitles,
          employeeTitles
        );
        delete employeeTitles.createdByUser.password;
        return employeeTitles;
      }
    );
  }

  async batchCreate(dtos: BatchCreateEmployeeTitleDto[]) {
    try {
      return await this.employeeTitlesRepo.manager.transaction(
        async (entityManager) => {
          const success = [];
          const warning = [];
          const failed = [];
          for (const dto of dtos) {
            try {
              let employeeTitle = await entityManager.findOne(EmployeeTitles, {
                where: {
                  name: dto.name,
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  active: true,
                },
              });
              if (!employeeTitle) {
                employeeTitle = new EmployeeTitles();
              }
              employeeTitle.name = dto.name;
              const timestamp = await entityManager
                .query(CONST_QUERYCURRENT_TIMESTAMP)
                .then((res) => {
                  return res[0]["timestamp"];
                });
              employeeTitle.createdDate = timestamp;

              const school = await entityManager.findOne(Schools, {
                where: {
                  orgSchoolCode: dto.orgSchoolCode,
                  active: true,
                },
              });
              if (!school) {
                throw Error(SCHOOLS_ERROR_NOT_FOUND);
              }
              employeeTitle.school = school;

              const createdByUser = await entityManager.findOne(Users, {
                where: {
                  userId: dto.createdByUserId,
                  active: true,
                },
              });
              if (!createdByUser) {
                throw Error(USER_ERROR_USER_NOT_FOUND);
              }
              employeeTitle.createdByUser = createdByUser;
              employeeTitle = await entityManager.save(employeeTitle);
              employeeTitle.employeeTitleCode = generateIndentityCode(
                employeeTitle.employeeTitleId
              );
              employeeTitle = await entityManager.save(
                EmployeeTitles,
                employeeTitle
              );
              delete employeeTitle.createdByUser.password;
              success.push({
                name: dto.name,
                refId: dto.refId,
              });
            } catch (ex) {
              failed.push({
                name: dto.name,
                refId: dto.refId,
                comments: ex?.message,
              });
            }
          }
          return {
            success,
            warning,
            failed,
          };
        }
      );
    } catch (ex) {
      throw ex;
    }
  }

  async update(employeeTitleCode, dto: UpdateEmployeeTitleDto) {
    return await this.employeeTitlesRepo.manager.transaction(
      async (entityManager) => {
        let employeeTitles = await entityManager.findOne(EmployeeTitles, {
          where: {
            employeeTitleCode,
            active: true,
          },
        });
        if (!employeeTitles) {
          throw Error(EMPLOYEETITLES_ERROR_NOT_FOUND);
        }
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeTitles.updatedDate = timestamp;

        const updatedByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.updatedByUserId,
            active: true,
          },
        });
        if (!updatedByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        employeeTitles.updatedByUser = updatedByUser;
        employeeTitles.name = dto.name;
        employeeTitles = await entityManager.save(
          EmployeeTitles,
          employeeTitles
        );
        if (employeeTitles?.createdByUser?.password) {
          delete employeeTitles.createdByUser.password;
        }
        if (employeeTitles?.updatedByUser?.password) {
          delete employeeTitles.updatedByUser.password;
        }
        return employeeTitles;
      }
    );
  }

  async delete(employeeTitleCode) {
    return await this.employeeTitlesRepo.manager.transaction(
      async (entityManager) => {
        const employeeTitles = await entityManager.findOne(EmployeeTitles, {
          where: {
            employeeTitleCode,
            active: true,
          },
        });
        if (!employeeTitles) {
          throw Error(EMPLOYEETITLES_ERROR_NOT_FOUND);
        }
        employeeTitles.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employeeTitles.updatedDate = timestamp;
        return await entityManager.save(EmployeeTitles, employeeTitles);
      }
    );
  }
}
