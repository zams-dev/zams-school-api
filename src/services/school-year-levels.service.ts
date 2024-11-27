import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import {
  BatchCreateSchoolYearLevelDto,
  CreateSchoolYearLevelDto,
} from "src/core/dto/school-year-levels/school-year-levels.create.dto";
import { UpdateSchoolYearLevelDto } from "src/core/dto/school-year-levels/school-year-levels.update.dto";
import { Departments } from "src/db/entities/Departments";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class SchoolYearLevelsService {
  constructor(
    @InjectRepository(SchoolYearLevels)
    private readonly schoolYearLevelsRepo: Repository<SchoolYearLevels>
  ) {}

  async getSchoolYearLevelsPagination({
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
      this.schoolYearLevelsRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          school: true,
          createdByUser: true,
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.schoolYearLevelsRepo.count({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
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

  async getByCode(schoolYearLevelCode) {
    const result = await this.schoolYearLevelsRepo.findOne({
      where: {
        schoolYearLevelCode,
        active: true,
      },
      relations: {
        school: true,
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateSchoolYearLevelDto) {
    try {
      return await this.schoolYearLevelsRepo.manager.transaction(
        async (entityManager) => {
          let schoolYearLevels = new SchoolYearLevels();
          schoolYearLevels.name = dto.name;
          schoolYearLevels.educationalStage =
            dto.educationalStage.toUpperCase();
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          schoolYearLevels.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          schoolYearLevels.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          schoolYearLevels.createdByUser = createdByUser;
          schoolYearLevels = await entityManager.save(
            SchoolYearLevels,
            schoolYearLevels
          );
          schoolYearLevels.schoolYearLevelCode = generateIndentityCode(
            schoolYearLevels.schoolYearLevelId
          );
          schoolYearLevels = await entityManager.save(
            SchoolYearLevels,
            schoolYearLevels
          );
          delete schoolYearLevels.createdByUser.password;
          return schoolYearLevels;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_school_year_level")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async batchCreate(dtos: BatchCreateSchoolYearLevelDto[]) {
    try {
      return await this.schoolYearLevelsRepo.manager.transaction(
        async (entityManager) => {
          const success = [];
          const warning = [];
          const failed = [];
          for (const dto of dtos) {
            try {
              let schoolYearLevel = await entityManager.findOne(
                SchoolYearLevels,
                {
                  where: {
                    name: dto.name,
                    school: {
                      orgSchoolCode: dto.orgSchoolCode,
                    },
                    active: true,
                  },
                }
              );
              if (!schoolYearLevel) {
                schoolYearLevel = new SchoolYearLevels();
              }

              schoolYearLevel.name = dto.name;
              schoolYearLevel.educationalStage =
                dto.educationalStage.toUpperCase();
              const timestamp = await entityManager
                .query(CONST_QUERYCURRENT_TIMESTAMP)
                .then((res) => {
                  return res[0]["timestamp"];
                });
              schoolYearLevel.createdDate = timestamp;

              const school = await entityManager.findOne(Schools, {
                where: {
                  orgSchoolCode: dto.orgSchoolCode,
                  active: true,
                },
              });
              if (!school) {
                throw Error(SCHOOLS_ERROR_NOT_FOUND);
              }
              schoolYearLevel.school = school;

              const createdByUser = await entityManager.findOne(Users, {
                where: {
                  userId: dto.createdByUserId,
                  active: true,
                },
              });
              if (!createdByUser) {
                throw Error(USER_ERROR_USER_NOT_FOUND);
              }
              schoolYearLevel.createdByUser = createdByUser;
              schoolYearLevel = await entityManager.save(
                SchoolYearLevels,
                schoolYearLevel
              );
              schoolYearLevel.schoolYearLevelCode = generateIndentityCode(
                schoolYearLevel.schoolYearLevelId
              );
              schoolYearLevel = await entityManager.save(
                SchoolYearLevels,
                schoolYearLevel
              );
              delete schoolYearLevel.createdByUser.password;
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

  async update(schoolYearLevelCode, dto: UpdateSchoolYearLevelDto) {
    try {
      return await this.schoolYearLevelsRepo.manager.transaction(
        async (entityManager) => {
          let schoolYearLevels = await entityManager.findOne(SchoolYearLevels, {
            where: {
              schoolYearLevelCode,
              active: true,
            },
          });
          if (!schoolYearLevels) {
            throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
          }
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          schoolYearLevels.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          schoolYearLevels.updatedByUser = updatedByUser;
          schoolYearLevels.name = dto.name;
          schoolYearLevels.educationalStage = dto.educationalStage;
          schoolYearLevels = await entityManager.save(
            SchoolYearLevels,
            schoolYearLevels
          );
          if (schoolYearLevels?.createdByUser?.password) {
            delete schoolYearLevels.createdByUser.password;
          }
          if (schoolYearLevels?.updatedByUser?.password) {
            delete schoolYearLevels.updatedByUser.password;
          }
          return schoolYearLevels;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_school_year_level")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async delete(schoolYearLevelCode) {
    return await this.schoolYearLevelsRepo.manager.transaction(
      async (entityManager) => {
        const schoolYearLevels = await entityManager.findOne(SchoolYearLevels, {
          where: {
            schoolYearLevelCode,
            active: true,
          },
        });
        if (!schoolYearLevels) {
          throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
        }
        schoolYearLevels.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        schoolYearLevels.updatedDate = timestamp;
        return await entityManager.save(SchoolYearLevels, schoolYearLevels);
      }
    );
  }
}
