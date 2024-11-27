import { EMPLOYEETITLES_ERROR_NOT_FOUND } from "./../common/constant/employee-titles.constant";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from 'moment-timezone';
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { EMPLOYEES_ERROR_NOT_FOUND } from "src/common/constant/employees.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  hash,
  generateIndentityCode,
} from "src/common/utils/utils";
import { BatchCreateEmployeeDto } from "src/core/dto/employees/employees.batch-create.dto";
import { CreateEmployeeDto } from "src/core/dto/employees/employees.create.dto";
import { UpdateEmployeeDto } from "src/core/dto/employees/employees.update.dto";
import { Courses } from "src/db/entities/Courses";
import { Departments } from "src/db/entities/Departments";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { Employees } from "src/db/entities/Employees";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { Schools } from "src/db/entities/Schools";
import { Sections } from "src/db/entities/Sections";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employees)
    private readonly employeeRepo: Repository<Employees>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.employeeRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          department: true,
          createdByUser: true,
          updatedByUser: true,
          school: true,
          employeeUser: {
            user: true,
          },
          employeePosition: true,
        },
        skip,
        take,
        order,
      }),
      this.employeeRepo.count({
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

  async getByCode(employeeCode) {
    const res = await this.employeeRepo.findOne({
      where: {
        employeeCode,
        active: true,
      },
      relations: {
        department: true,
        createdByUser: true,
        updatedByUser: true,
        school: true,
        employeePosition: true,
      },
    });

    if (!res) {
      throw Error(EMPLOYEES_ERROR_NOT_FOUND);
    }
    delete res.employeeUser?.user?.password;
    delete res.createdByUser.password;
    if (res?.updatedByUser?.password) {
      delete res.updatedByUser.password;
    }
    return res;
  }

  async create(dto: CreateEmployeeDto) {
    try {
      return await this.employeeRepo.manager.transaction(
        async (entityManager) => {
          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          let employee = new Employees();
          employee.school = school;
          employee.accessGranted = true;
          employee.fullName = dto.fullName;
          employee.mobileNumber = dto.mobileNumber;
          employee.cardNumber = dto.cardNumber;
          employee.orgEmployeeId = dto.orgEmployeeId;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          employee.createdDate = timestamp;

          const registeredByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!registeredByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          employee.createdByUser = registeredByUser;

          if (dto.departmentId && dto.departmentId !== "") {
            const department = await entityManager.findOne(Departments, {
              where: {
                departmentId: dto.departmentId,
                school: {
                  schoolId: dto.schoolId,
                },
                active: true,
              },
            });
            if (!department) {
              throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
            }
            employee.department = department;
          }

          if (dto.departmentId && dto.departmentId !== "") {
            const employeePosition = await entityManager.findOne(
              EmployeeTitles,
              {
                where: {
                  employeeTitleId: dto.employeeTitleId,
                  school: {
                    schoolId: dto.schoolId,
                  },
                  active: true,
                },
              }
            );
            if (!employeePosition) {
              throw Error(EMPLOYEETITLES_ERROR_NOT_FOUND);
            }
            employee.employeePosition = employeePosition;
          }

          employee = await entityManager.save(Employees, employee);
          employee.employeeCode = generateIndentityCode(employee.employeeId);
          employee = await entityManager.save(Employees, employee);

          employee = await entityManager.findOne(Employees, {
            where: {
              employeeCode: employee.employeeCode,
              active: true,
            },
            relations: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
            },
          });
          delete employee.employeeUser?.user?.password;
          delete employee.createdByUser.password;
          return employee;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_user")
      ) {
        throw Error("Username already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_employees_number")
      ) {
        throw Error("Mobile number already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_employees_card")
      ) {
        throw Error("Card number already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].toLowerCase().includes("u_employees_orgemployeeid")
      ) {
        throw Error("Employee Id already used!");
      } else {
        throw ex;
      }
    }
  }

  async createBatch(dtos: BatchCreateEmployeeDto[]) {
    try {
      return await this.employeeRepo.manager.transaction(
        async (entityManager) => {
          const success = [];
          const warning = [];
          const failed = [];
          for (const dto of dtos) {
            try {
              let hasWarning = false;
              const school = await entityManager.findOne(Schools, {
                where: {
                  orgSchoolCode: dto.orgSchoolCode,
                  active: true,
                },
              });
              if (!school) {
                throw Error(SCHOOLS_ERROR_NOT_FOUND);
              }
              let employee = await entityManager.findOne(Employees, {
                where: {
                  orgEmployeeId: dto.orgEmployeeId,
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  active: true,
                },
              });
              if (!employee) {
                employee = new Employees();
              }

              employee.school = school;
              employee.accessGranted = true;
              employee.fullName = dto.fullName;
              employee.mobileNumber = dto.mobileNumber;
              if (dto.cardNumber && dto.cardNumber !== "") {
                employee.cardNumber = dto.cardNumber;
              }
              if (dto.orgEmployeeId && dto.orgEmployeeId !== "") {
                employee.orgEmployeeId = dto.orgEmployeeId;
              } else {
                //create temporary id for easy filter
                employee.orgEmployeeId = `${dto.orgSchoolCode}${dto.fullName
                  ?.replace(/\s+/g, "")
                  .toUpperCase()}}`;
              }
              const timestamp = await entityManager
                .query(CONST_QUERYCURRENT_TIMESTAMP)
                .then((res) => {
                  return res[0]["timestamp"];
                });
              employee.createdDate = timestamp;

              const registeredByUser = await entityManager.findOne(Users, {
                where: {
                  userId: dto.createdByUserId,
                  active: true,
                },
              });
              if (!registeredByUser) {
                throw Error(USER_ERROR_USER_NOT_FOUND);
              }
              employee.createdByUser = registeredByUser;
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
                  if (dto.orgEmployeeId && dto.orgEmployeeId !== "") {
                    warning.push({
                      orgEmployeeId: dto.orgEmployeeId,
                      refId: dto.refId,
                      comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                    });
                  }
                  hasWarning = true;
                }
                employee.department = department;
              } else {
                if (dto.orgEmployeeId && dto.orgEmployeeId !== "") {
                  warning.push({
                    orgEmployeeId: dto.orgEmployeeId,
                    refId: dto.refId,
                    comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                  });
                } else {
                  warning.push({
                    refId: dto.refId,
                    comments: `${DEPARTMENTS_ERROR_NOT_FOUND} ${dto.departmentName}`,
                  });
                }
                hasWarning = true;
              }

              if (dto.employeeTitleName && dto.employeeTitleName !== "") {
                const employeePosition: EmployeeTitles = (await entityManager
                  .createQueryBuilder("EmployeeTitles", "et")
                  .leftJoinAndSelect("et.school", "s")
                  .where(
                    "trim(upper(et.name)) = trim(upper(:employeeTitleName)) AND " +
                      "s.orgSchoolCode = :orgSchoolCode"
                  )
                  .setParameters({
                    employeeTitleName: dto.employeeTitleName,
                    orgSchoolCode: dto.orgSchoolCode,
                  })
                  .getOne()) as any;
                if (!employeePosition) {
                  if (dto.orgEmployeeId && dto.orgEmployeeId !== "") {
                    warning.push({
                      orgEmployeeId: dto.orgEmployeeId,
                      refId: dto.refId,
                      comments: `${EMPLOYEETITLES_ERROR_NOT_FOUND} ${dto.employeeTitleName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${EMPLOYEETITLES_ERROR_NOT_FOUND} ${dto.employeeTitleName}`,
                    });
                  }
                  hasWarning = true;
                }
                employee.employeePosition = employeePosition;
              } else {
                if (dto.orgEmployeeId && dto.orgEmployeeId !== "") {
                  warning.push({
                    orgEmployeeId: dto.orgEmployeeId,
                    refId: dto.refId,
                    comments: `${EMPLOYEETITLES_ERROR_NOT_FOUND} ${dto.employeeTitleName}`,
                  });
                } else {
                  warning.push({
                    refId: dto.refId,
                    comments: `${EMPLOYEETITLES_ERROR_NOT_FOUND} ${dto.employeeTitleName}`,
                  });
                }
                hasWarning = true;
              }

              employee = await entityManager.save(Employees, employee);
              employee.employeeCode = generateIndentityCode(
                employee.employeeId
              );
              employee = await entityManager.save(Employees, employee);

              employee = await entityManager.findOne(Employees, {
                where: {
                  employeeCode: employee.employeeCode,
                  active: true,
                },
                relations: {
                  department: true,
                  createdByUser: true,
                  updatedByUser: true,
                  school: true,
                  employeePosition: true,
                },
              });
              delete employee.employeeUser?.user?.password;
              delete employee.createdByUser.password;
              if (!hasWarning) {
                success.push({
                  orgEmployeeId: dto.orgEmployeeId,
                  refId: dto.refId,
                });
              }
            } catch (ex) {
              failed.push({
                orgEmployeeId: dto.orgEmployeeId,
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

  async update(employeeCode, dto: UpdateEmployeeDto) {
    try {
      return await this.employeeRepo.manager.transaction(
        async (entityManager) => {
          let employee = await entityManager.findOne(Employees, {
            where: {
              employeeCode,
              active: true,
            },
            relations: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
            },
          });

          if (!employee) {
            throw Error(EMPLOYEES_ERROR_NOT_FOUND);
          }

          employee.fullName = dto.fullName;
          employee.mobileNumber = dto.mobileNumber;
          employee.cardNumber = dto.cardNumber;
          employee.orgEmployeeId = dto.orgEmployeeId;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          employee.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          employee.updatedByUser = updatedByUser;

          const department = await entityManager.findOne(Departments, {
            where: {
              departmentId: dto.departmentId,
              active: true,
            },
          });
          if (!department) {
            throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
          }
          employee.department = department;

          const employeePosition = await entityManager.findOne(EmployeeTitles, {
            where: {
              employeeTitleId: dto.employeeTitleId,
              school: {
                schoolId: employee.school.schoolId,
              },
              active: true,
            },
          });
          if (!employeePosition) {
            throw Error(EMPLOYEETITLES_ERROR_NOT_FOUND);
          }
          employee.employeePosition = employeePosition;
          employee = await entityManager.save(Employees, employee);

          employee = await entityManager.findOne(Employees, {
            where: {
              employeeCode,
              active: true,
            },
            relations: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
            },
          });
          delete employee.employeeUser?.user?.password;
          delete employee.createdByUser.password;
          if (employee?.updatedByUser?.password) {
            delete employee.updatedByUser.password;
          }
          return employee;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_user")
      ) {
        throw Error("Username already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_employees_number")
      ) {
        throw Error("Mobile number already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_employees_card")
      ) {
        throw Error("Card number already used!");
      } else {
        throw ex;
      }
    }
  }

  async delete(employeeCode) {
    return await this.employeeRepo.manager.transaction(
      async (entityManager) => {
        let employee = await entityManager.findOne(Employees, {
          where: {
            employeeCode,
            active: true,
          },
          relations: {
            department: true,
            createdByUser: true,
            updatedByUser: true,
            school: true,
            employeePosition: true,
          },
        });

        if (!employee) {
          throw Error(EMPLOYEES_ERROR_NOT_FOUND);
        }

        employee.active = false;
        await entityManager.save(Employees, employee);
        const employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeId: employee.employeeId,
            },
          },
          relations: {
            user: true,
          },
        });
        if (employeeUser) {
          const user = employeeUser.user;
          user.active = false;
          await entityManager.save(Users, user);
          await entityManager.delete(EmployeeUser, employeeUser);
        }
        employee = await entityManager.findOne(Employees, {
          where: {
            employeeCode,
          },
          relations: {
            department: true,
            createdByUser: true,
            updatedByUser: true,
            school: true,
            employeePosition: true,
          },
        });
        delete employee.employeeUser?.user?.password;
        delete employee.createdByUser.password;
        if (employee?.updatedByUser?.password) {
          delete employee.updatedByUser.password;
        }
        return employee;
      }
    );
  }
}
