import { Schools } from "src/db/entities/Schools";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import {
  BatchCreateDepartmentDto,
  CreateDepartmentDto,
} from "src/core/dto/departments/departments.create.dto";
import { UpdateDepartmentDto } from "src/core/dto/departments/departments.update.dto";
import { Departments } from "src/db/entities/Departments";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Departments)
    private readonly departmentsRepo: Repository<Departments>
  ) {}

  async getDepartmentsPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.departmentsRepo.find({
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
      this.departmentsRepo.count({
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

  async getByCode(departmentCode) {
    const result = await this.departmentsRepo.findOne({
      where: {
        departmentCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateDepartmentDto) {
    try {
      return await this.departmentsRepo.manager.transaction(
        async (entityManager) => {
          let departments = new Departments();
          departments.departmentName = dto.departmentName;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          departments.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          departments.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          departments.createdByUser = createdByUser;
          departments.type = dto.type;
          departments = await entityManager.save(departments);
          departments.departmentCode = generateIndentityCode(
            departments.departmentId
          );
          departments = await entityManager.save(Departments, departments);
          delete departments.createdByUser.password;
          return departments;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_department")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async batchCreate(dtos: BatchCreateDepartmentDto[]) {
    return await this.departmentsRepo.manager.transaction(
      async (entityManager) => {
        const success = [];
        const warning = [];
        const failed = [];
        for (const dto of dtos) {
          try {
            let department = await entityManager.findOne(Departments, {
              where: {
                departmentName: dto.departmentName,
                school: {
                  orgSchoolCode: dto.orgSchoolCode,
                },
                active: true,
              },
            });
            if (!department) {
              department = new Departments();
            }
            department.departmentName = dto.departmentName;
            const timestamp = await entityManager
              .query(CONST_QUERYCURRENT_TIMESTAMP)
              .then((res) => {
                return res[0]["timestamp"];
              });
            department.createdDate = timestamp;

            const school = await entityManager.findOne(Schools, {
              where: {
                orgSchoolCode: dto.orgSchoolCode,
                active: true,
              },
            });
            if (!school) {
              throw Error(SCHOOLS_ERROR_NOT_FOUND);
            }
            department.school = school;

            const createdByUser = await entityManager.findOne(Users, {
              where: {
                userId: dto.createdByUserId,
                active: true,
              },
            });
            if (!createdByUser) {
              throw Error(USER_ERROR_USER_NOT_FOUND);
            }
            department.type = dto.type;
            department.createdByUser = createdByUser;
            department = await entityManager.save(department);
            department.departmentCode = generateIndentityCode(
              department.departmentId
            );
            department = await entityManager.save(Departments, department);
            delete department.createdByUser.password;
            success.push({
              departmentName: dto.departmentName,
              refId: dto.refId,
            });
          } catch (ex) {
            failed.push({
              departmentName: dto.departmentName,
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
  }

  async update(departmentCode, dto: UpdateDepartmentDto) {
    try {
      return await this.departmentsRepo.manager.transaction(
        async (entityManager) => {
          let departments = await entityManager.findOne(Departments, {
            where: {
              departmentCode,
              active: true,
            },
          });
          if (!departments) {
            throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
          }
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          departments.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          departments.updatedByUser = updatedByUser;
          departments.departmentName = dto.departmentName;
          departments = await entityManager.save(Departments, departments);
          if (departments?.createdByUser?.password) {
            delete departments.createdByUser.password;
          }
          if (departments?.updatedByUser?.password) {
            delete departments.updatedByUser.password;
          }
          return departments;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_department")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async delete(departmentCode) {
    return await this.departmentsRepo.manager.transaction(
      async (entityManager) => {
        const departments = await entityManager.findOne(Departments, {
          where: {
            departmentCode,
            active: true,
          },
        });
        if (!departments) {
          throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
        }
        departments.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        departments.updatedDate = timestamp;
        return await entityManager.save(Departments, departments);
      }
    );
  }
}
