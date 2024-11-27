import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { EMPLOYEETITLES_ERROR_NOT_FOUND } from "src/common/constant/employee-titles.constant";
import { EMPLOYEEUSERACCESS_ERROR_NOT_FOUND } from "src/common/constant/employee-user-access.constant";
import { EMPLOYEEUSER_ERROR_NOT_FOUND } from "src/common/constant/employee-user.constant";
import { EMPLOYEES_ERROR_NOT_FOUND } from "src/common/constant/employees.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  hash,
} from "src/common/utils/utils";
import { UpdateUserPasswordFromAdminDto } from "src/core/dto/auth/reset-password.dto";
import {
  CreateEmployeeUserDto,
  CreateEmployeeUserFromEmployeeDto,
} from "src/core/dto/employee-user/employee-user.create.dto";
import {
  UpdateEmployeeUserDto,
  UpdateEmployeeUserProfileDto,
  UpdateEmployeeUserProfilePasswordDto,
} from "src/core/dto/employee-user/employee-user.update.dto";
import { UpdateEmployeeDto } from "src/core/dto/employees/employees.update.dto";
import { Departments } from "src/db/entities/Departments";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { EmployeeUserAccess } from "src/db/entities/EmployeeUserAccess";
import { Employees } from "src/db/entities/Employees";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class EmployeeUserService {
  constructor(
    @InjectRepository(EmployeeUser)
    private readonly employeeUserRepo: Repository<EmployeeUser>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.employeeUserRepo.find({
        where: {
          ...condition,
        },
        relations: {
          employee: {
            department: true,
            createdByUser: true,
            updatedByUser: true,
            school: true,
            employeePosition: true,
          },
          user: true,
          employeeUserAccess: true,
        },
        skip,
        take,
        order,
      }),
      this.employeeUserRepo.count({
        where: {
          ...condition,
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

  async getByEmployeeCode(employeeCode) {
    const res = await this.employeeUserRepo.findOne({
      where: {
        employee: {
          employeeCode,
        },
      },
      relations: {
        employee: {
          department: true,
          createdByUser: true,
          updatedByUser: true,
          school: true,
          employeePosition: true,
          employeeUser: {
            user: true,
            employeeUserAccess: true,
          },
        },
        user: true,
        employeeUserAccess: true,
      },
    });

    if (!res) {
      throw Error(EMPLOYEES_ERROR_NOT_FOUND);
    }
    delete res?.user?.password;
    delete res?.employee?.createdByUser.password;
    if (res?.employee?.updatedByUser?.password) {
      delete res?.employee?.updatedByUser.password;
    }
    return res;
  }

  async create(dto: CreateEmployeeUserDto) {
    try {
      return await this.employeeUserRepo.manager.transaction(
        async (entityManager) => {
          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolCode,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }

          let user = new Users();
          user.userType = USER_TYPE.EMPLOYEE;
          user.userName = dto.userName;
          user.password = await hash(dto.password);
          user = await entityManager.save(Users, user);
          user.userCode = generateIndentityCode(user.userId);
          user = await entityManager.save(Users, user);

          let employee = new Employees();
          employee.school = school;
          employee.accessGranted = true;
          employee.fullName = dto.fullName;
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

          const department = await entityManager.findOne(Departments, {
            where: {
              departmentId: dto.departmentId,
              school: {
                schoolId: dto.schoolCode,
              },
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
                schoolId: dto.schoolCode,
              },
              active: true,
            },
          });
          if (!employeePosition) {
            throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
          }
          employee.employeePosition = employeePosition;

          employee = await entityManager.save(Employees, employee);
          employee.employeeCode = generateIndentityCode(employee.employeeId);
          employee = await entityManager.save(Employees, employee);

          let employeeUser = new EmployeeUser();
          employeeUser.user = user;
          employeeUser.employee = employee;
          employeeUser.dateRegistered = timestamp;

          const employeeUserAccess = await entityManager.findOne(
            EmployeeUserAccess,
            {
              where: {
                employeeUserAccessId: dto.employeeUserAccessId,
                school: {
                  schoolId: dto.schoolCode,
                },
                active: true,
              },
            }
          );
          if (!employeeUserAccess) {
            throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
          }
          employeeUser.employeeUserAccess = employeeUserAccess;
          employeeUser = await entityManager.save(EmployeeUser, employeeUser);

          employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode: employeeUser.employee.employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
              },
              user: true,
              employeeUserAccess: true,
            },
          });
          delete employeeUser?.user?.password;
          delete employeeUser.employee.createdByUser.password;
          return employeeUser;
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

  async createFromEmployee(dto: CreateEmployeeUserFromEmployeeDto) {
    try {
      return await this.employeeUserRepo.manager.transaction(
        async (entityManager) => {
          const { employeeId } = dto;
          const employee = await entityManager.findOne(Employees, {
            where: {
              employeeId,
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
            throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
          }

          let user = new Users();
          user.userType = USER_TYPE.EMPLOYEE;
          user.userName = dto.userName;
          user.password = await hash(dto.password);
          user = await entityManager.save(Users, user);
          user.userCode = generateIndentityCode(user.userId);
          user = await entityManager.save(Users, user);

          let employeeUser = new EmployeeUser();
          employeeUser.user = user;
          employeeUser.employee = employee;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          employeeUser.dateRegistered = timestamp;

          const employeeUserAccess = await entityManager.findOne(
            EmployeeUserAccess,
            {
              where: {
                employeeUserAccessId: dto.employeeUserAccessId,
                school: {
                  schoolId: employee.school.schoolId,
                },
                active: true,
              },
            }
          );
          if (!employeeUserAccess) {
            throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
          }
          employeeUser.employeeUserAccess = employeeUserAccess;
          employeeUser = await entityManager.save(EmployeeUser, employeeUser);

          employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode: employeeUser.employee.employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
                employeeUser: {
                  user: true,
                  employeeUserAccess: true,
                },
              },
              user: true,
              employeeUserAccess: true,
            },
          });
          delete employeeUser?.user?.password;
          delete employeeUser.employee.createdByUser.password;
          return employeeUser;
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

  async updateProfile(employeeCode, dto: UpdateEmployeeUserProfileDto) {
    try {
      return await this.employeeUserRepo.manager.transaction(
        async (entityManager) => {
          let employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
                employeeUser: {
                  user: true,
                  employeeUserAccess: true,
                },
              },
              employeeUserAccess: true,
              user: true,
            },
          });

          if (!employeeUser) {
            throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
          }

          let employee = employeeUser.employee;
          employee.fullName = dto.fullName;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          employee.updatedDate = timestamp;
          employee.updatedByUser = employee.employeeUser?.user;
          employee = await entityManager.save(Employees, employee);

          employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode: employeeUser.employee.employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
                employeeUser: {
                  user: true,
                  employeeUserAccess: true,
                },
              },
              user: true,
              employeeUserAccess: true,
            },
          });
          delete employeeUser?.user?.password;
          delete employeeUser.employee.createdByUser.password;
          return employeeUser;
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

  async update(employeeCode, dto: UpdateEmployeeUserDto) {
    try {
      return await this.employeeUserRepo.manager.transaction(
        async (entityManager) => {
          let employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
                employeeUser: {
                  user: true,
                  employeeUserAccess: true,
                },
              },
              employeeUserAccess: true,
              user: true,
            },
          });

          if (!employeeUser) {
            throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
          }

          let employee = employeeUser.employee;
          employee.fullName = dto.fullName;
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

          const employeeUserAccess = await entityManager.findOne(
            EmployeeUserAccess,
            {
              where: {
                employeeUserAccessId: dto.employeeUserAccessId,
                school: {
                  schoolId: employee.school.schoolId,
                },
                active: true,
              },
            }
          );
          if (!employeeUserAccess) {
            throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
          }
          employeeUser.employeeUserAccess = employeeUserAccess;
          employeeUser = await entityManager.save(EmployeeUser, employeeUser);

          employeeUser = await entityManager.findOne(EmployeeUser, {
            where: {
              employee: {
                employeeCode,
              },
            },
            relations: {
              employee: {
                department: true,
                createdByUser: true,
                updatedByUser: true,
                school: true,
                employeePosition: true,
                employeeUser: {
                  user: true,
                  employeeUserAccess: true,
                },
              },
              user: true,
              employeeUserAccess: true,
            },
          });
          delete employeeUser?.user?.password;
          delete employeeUser.employee.createdByUser.password;
          return employeeUser;
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

  async updatePassword(
    employeeCode,
    dto: UpdateEmployeeUserProfilePasswordDto
  ) {
    return await this.employeeUserRepo.manager.transaction(
      async (entityManager) => {
        let employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            employeeUserAccess: true,
            user: true,
          },
        });

        if (!employeeUser) {
          throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
        }

        const user = employeeUser?.user;
        user.password = await hash(dto.password);
        await entityManager.save(Users, user);
        employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode: employeeUser.employee.employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            user: true,
            employeeUserAccess: true,
          },
        });
        delete employeeUser?.user?.password;
        delete employeeUser.employee.createdByUser.password;
        return employeeUser;
      }
    );
  }

  async updatePasswordFromAdmin(
    employeeCode,
    dto: UpdateUserPasswordFromAdminDto
  ) {
    return await this.employeeUserRepo.manager.transaction(
      async (entityManager) => {
        let employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            employeeUserAccess: true,
            user: true,
          },
        });

        if (!employeeUser) {
          throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
        }

        const user = employeeUser?.user;
        user.password = await hash(dto.password);
        await entityManager.save(Users, user);
        employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode: employeeUser.employee.employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            user: true,
            employeeUserAccess: true,
          },
        });
        delete employeeUser?.user?.password;
        delete employeeUser.employee.createdByUser.password;
        return employeeUser;
      }
    );
  }

  async approveAccessRequest(employeeCode) {
    return await this.employeeUserRepo.manager.transaction(
      async (entityManager) => {
        let employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            employeeUserAccess: true,
            user: true,
          },
        });

        if (!employeeUser) {
          throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
        }

        let employee = employeeUser.employee;

        employee.accessGranted = true;
        employee = await entityManager.save(Employees, employee);

        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        employee.updatedDate = timestamp;
        employeeUser.dateRegistered = timestamp;
        employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode: employeeUser.employee.employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
            },
            user: true,
            employeeUserAccess: true,
          },
        });
        delete employeeUser?.user?.password;
        delete employeeUser.employee.createdByUser.password;
        return employeeUser;
      }
    );
  }

  async delete(employeeCode) {
    return await this.employeeUserRepo.manager.transaction(
      async (entityManager) => {
        const employeeUser = await entityManager.findOne(EmployeeUser, {
          where: {
            employee: {
              employeeCode,
            },
          },
          relations: {
            employee: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
            },
            employeeUserAccess: true,
            user: true,
          },
        });

        if (!employeeUser) {
          throw Error(EMPLOYEEUSER_ERROR_NOT_FOUND);
        }
        const user = employeeUser.user;
        user.active = false;
        await entityManager.save(Users, user);

        await entityManager.delete(EmployeeUser, employeeUser);

        return employeeUser;
      }
    );
  }
}
