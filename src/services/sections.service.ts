import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { SECTIONS_ERROR_NOT_FOUND } from "src/common/constant/sections.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { BatchCreateSectionDto, CreateSectionDto } from "src/core/dto/sections/sections.create.dto";
import { UpdateSectionDto } from "src/core/dto/sections/sections.update.dto";
import { Sections } from "src/db/entities/Sections";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { Departments } from "src/db/entities/Departments";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { Employees } from "src/db/entities/Employees";
import { EMPLOYEES_ERROR_NOT_FOUND } from "src/common/constant/employees.constant";

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Sections)
    private readonly sectionsRepo: Repository<Sections>
  ) {}

  async getSectionsPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.sectionsRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          school: true,
          department: true,
          adviserEmployee: true,
          schoolYearLevel: true,
          createdByUser: true,
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.sectionsRepo.count({
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

  async getByCode(sectionCode) {
    const result = await this.sectionsRepo.findOne({
      where: {
        sectionCode,
        active: true,
      },
      relations: {
        school: true,
        department: true,
        adviserEmployee: true,
        schoolYearLevel: true,
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(SECTIONS_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateSectionDto) {
    return await this.sectionsRepo.manager.transaction(
      async (entityManager) => {
        let sections = new Sections();
        sections.sectionName = dto.sectionName;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        sections.createdDate = timestamp;

        const school = await entityManager.findOne(Schools, {
          where: {
            schoolId: dto.schoolId,
            active: true,
          },
        });
        if (!school) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }
        sections.school = school;

        const adviserEmployee = await entityManager.findOne(Employees, {
          where: {
            employeeId: dto.adviserEmployeeId,
            active: true,
          },
        });
        if (!adviserEmployee) {
          throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
        }
        sections.adviserEmployee = adviserEmployee;

        const department = await entityManager.findOne(Departments, {
          where: {
            departmentId: dto.departmentId,
            active: true,
          },
        });
        if (!department) {
          throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
        }
        sections.department = department;

        const schoolYearLevel = await entityManager.findOne(SchoolYearLevels, {
          where: {
            schoolYearLevelId: dto.schoolYearLevelId,
            active: true,
          },
        });
        if (!schoolYearLevel) {
          throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
        }
        sections.schoolYearLevel = schoolYearLevel;

        const createdByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.createdByUserId,
            active: true,
          },
        });
        if (!createdByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        sections.createdByUser = createdByUser;
        sections = await entityManager.save(sections);
        sections.sectionCode = generateIndentityCode(sections.sectionId);
        sections = await entityManager.save(Sections, sections);
        sections = await entityManager.findOne(Sections, {
          where: {
            sectionId: sections.sectionId,
            active: true,
          },
          relations: {
            school: true,
            department: true,
            adviserEmployee: true,
            schoolYearLevel: true,
            createdByUser: true,
            updatedByUser: true,
          },
        });
        delete sections.createdByUser.password;
        return sections;
      }
    );
  }

  async batchCreate(dtos: BatchCreateSectionDto[]) {
    try {
      return await this.sectionsRepo.manager.transaction(
        async (entityManager) => {
          const success = [];
          const warning = [];
          const failed = [];
          for (const dto of dtos) {
            try {
              let hasWarning = false;
              let sections = new Sections();
              sections.sectionName = dto.sectionName;
              const timestamp = await entityManager
                .query(CONST_QUERYCURRENT_TIMESTAMP)
                .then((res) => {
                  return res[0]["timestamp"];
                });
              sections.createdDate = timestamp;

              const school = await entityManager.findOne(Schools, {
                where: {
                  orgSchoolCode: dto.orgSchoolCode,
                  active: true,
                },
              });
              if (!school) {
                throw Error(SCHOOLS_ERROR_NOT_FOUND);
              }
              sections.school = school;

              const adviserEmployee = await entityManager.findOne(Employees, {
                where: {
                  orgEmployeeId: dto.adviserOrgEmployeeId,
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  active: true,
                },
              });
              if (adviserEmployee) {
                sections.adviserEmployee = adviserEmployee;
              } else {
                warning.push({
                  sectionName: dto.sectionName,
                  refId: dto.refId,
                  comments: `${EMPLOYEES_ERROR_NOT_FOUND} ${dto.departmentName}`,
                });
                hasWarning = true;
              }

              if (dto.departmentName && dto.departmentName !== "") {
                const department: Departments = (await entityManager
                  .createQueryBuilder("Departments", "d")
                  .leftJoinAndSelect("d.school", "s")
                  .where(
                    "trim(upper(d.departmentName)) = trim(upper(:departmentName)) AND " +
                      "s.orgSchoolCode = :orgSchoolCode"
                  )
                  .setParameters({
                    departmentName: dto.departmentName,
                    orgSchoolCode: dto.orgSchoolCode,
                  })
                  .getOne()) as any;
                if (!department) {
                  warning.push({
                    sectionName: dto.sectionName,
                    refId: dto.refId,
                    comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                  });
                  hasWarning = true;
                }
                sections.department = department;
              } else {
                warning.push({
                  sectionName: dto.sectionName,
                  refId: dto.refId,
                  comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                });
                hasWarning = true;
              }

              if (dto.schoolYearLevelName && dto.schoolYearLevelName !== "") {
                const schoolYearLevel: SchoolYearLevels = (await entityManager
                  .createQueryBuilder("SchoolYearLevels", "syl")
                  .leftJoinAndSelect("syl.school", "s")
                  .where(
                    "trim(upper(syl.name)) = trim(upper(:schoolYearLevelName)) AND " +
                      "s.orgSchoolCode = :orgSchoolCode"
                  )
                  .setParameters({
                    schoolYearLevelName: dto.schoolYearLevelName,
                    orgSchoolCode: dto.orgSchoolCode,
                  })
                  .getOne()) as any;
                if (!schoolYearLevel) {
                  warning.push({
                    sectionName: dto.sectionName,
                    refId: dto.refId,
                    comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                  });
                  hasWarning = true;
                }
                sections.schoolYearLevel = schoolYearLevel;
              } else {
                warning.push({
                  sectionName: dto.sectionName,
                  refId: dto.refId,
                  comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                });
                hasWarning = true;
              }

              const createdByUser = await entityManager.findOne(Users, {
                where: {
                  userId: dto.createdByUserId,
                  active: true,
                },
              });
              if (!createdByUser) {
                throw Error(USER_ERROR_USER_NOT_FOUND);
              }
              sections.createdByUser = createdByUser;
              sections = await entityManager.save(sections);
              sections.sectionCode = generateIndentityCode(sections.sectionId);
              sections = await entityManager.save(Sections, sections);
              sections = await entityManager.findOne(Sections, {
                where: {
                  sectionId: sections.sectionId,
                  active: true,
                },
                relations: {
                  school: true,
                  department: true,
                  adviserEmployee: true,
                  schoolYearLevel: true,
                  createdByUser: true,
                  updatedByUser: true,
                },
              });
              delete sections.createdByUser.password;
              success.push({
                sectionName: dto.sectionName,
                refId: dto.refId,
              });
            } catch (ex) {
              failed.push({
                sectionName: dto.sectionName,
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

  async update(sectionCode, dto: UpdateSectionDto) {
    return await this.sectionsRepo.manager.transaction(
      async (entityManager) => {
        let sections = await entityManager.findOne(Sections, {
          where: {
            sectionCode,
            active: true,
          },
          relations: {
            school: true,
            department: true,
            adviserEmployee: true,
            schoolYearLevel: true,
            createdByUser: true,
            updatedByUser: true,
          },
        });
        if (!sections) {
          throw Error(SECTIONS_ERROR_NOT_FOUND);
        }
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        sections.updatedDate = timestamp;

        const adviserEmployee = await entityManager.findOne(Employees, {
          where: {
            employeeId: dto.adviserEmployeeId,
            active: true,
          },
        });
        if (!adviserEmployee) {
          throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
        }
        sections.adviserEmployee = adviserEmployee;

        const department = await entityManager.findOne(Departments, {
          where: {
            departmentId: dto.departmentId,
            active: true,
          },
        });
        if (!department) {
          throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
        }
        sections.department = department;

        const schoolYearLevel = await entityManager.findOne(SchoolYearLevels, {
          where: {
            schoolYearLevelId: dto.schoolYearLevelId,
            active: true,
          },
        });
        if (!schoolYearLevel) {
          throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
        }
        sections.schoolYearLevel = schoolYearLevel;

        const updatedByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.updatedByUserId,
            active: true,
          },
        });
        if (!updatedByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        sections.updatedByUser = updatedByUser;
        sections.sectionName = dto.sectionName;
        sections = await entityManager.save(Sections, sections);
        sections = await entityManager.findOne(Sections, {
          where: {
            sectionId: sections.sectionId,
            active: true,
          },
          relations: {
            school: true,
            department: true,
            adviserEmployee: true,
            schoolYearLevel: true,
            createdByUser: true,
            updatedByUser: true,
          },
        });
        if (sections?.createdByUser?.password) {
          delete sections.createdByUser.password;
        }
        if (sections?.updatedByUser?.password) {
          delete sections.updatedByUser.password;
        }
        return sections;
      }
    );
  }

  async delete(sectionCode) {
    return await this.sectionsRepo.manager.transaction(
      async (entityManager) => {
        let sections = await entityManager.findOne(Sections, {
          where: {
            sectionCode,
            active: true,
          },
        });
        if (!sections) {
          throw Error(SECTIONS_ERROR_NOT_FOUND);
        }
        sections.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        sections.updatedDate = timestamp;
        sections = await entityManager.save(Sections, sections);
        sections = await entityManager.findOne(Sections, {
          where: {
            sectionId: sections.sectionId,
            active: true,
          },
          relations: {
            school: true,
            department: true,
            adviserEmployee: true,
            schoolYearLevel: true,
            createdByUser: true,
            updatedByUser: true,
          },
        });
        delete sections.createdByUser.password;
        if (sections?.updatedByUser?.password) {
          delete sections.updatedByUser.password;
        }
        return sections;
      }
    );
  }
}
