/* eslint-disable no-var */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtPayload } from "../core/interfaces/payload.interface";
import { JwtService } from "@nestjs/jwt";
import * as fs from "fs";
import * as path from "path";
import {
  compare,
  generateIndentityCode,
  generateOTP,
  getFullName,
  hash,
} from "src/common/utils/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, Repository } from "typeorm";
import moment from 'moment-timezone';
import { Users } from "src/db/entities/Users";
import { LOGIN_ERROR_PASSWORD_INCORRECT, LOGIN_ERROR_PENDING_ACCESS_REQUEST, LOGIN_ERROR_USERTYPE_INCORRECT, LOGIN_ERROR_USER_NOT_FOUND } from "src/common/constant/auth-error.constant";

import { Students } from "src/db/entities/Students";
import { Employees } from "src/db/entities/Employees";
import { Operators } from "src/db/entities/Operators";
import { RegisterStudentUserDto } from "src/core/dto/auth/register-student.dto";
import { RegisterEmployeeUserDto } from "src/core/dto/auth/register-employee.dto";
import { RegisterOperatorUserDto } from "src/core/dto/auth/register-operator.dto";
import { COURSES_ERROR_NOT_FOUND } from "src/common/constant/courses.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { SECTIONS_ERROR_NOT_FOUND } from "src/common/constant/sections.constant";
import { STUDENTS_ERROR_NOT_FOUND } from "src/common/constant/students.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { Courses } from "src/db/entities/Courses";
import { Departments } from "src/db/entities/Departments";
import { Schools } from "src/db/entities/Schools";
import { Sections } from "src/db/entities/Sections";
import { StudentCourse } from "src/db/entities/StudentCourse";
import { StudentSection } from "src/db/entities/StudentSection";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import { Clients } from "src/db/entities/Clients";
import { RegisterClientUserDto } from "src/core/dto/auth/register-client.dto";
import { EmployeeUser } from "src/db/entities/EmployeeUser";
import { Notifications } from "src/db/entities/Notifications";
import { EmailService } from "./email.service";
import { UserEmailVerificationLog } from "src/db/entities/UserEmailVerificationLog";
import { AUTH_USER_EMAIL_VERIFICATION_TYPE } from "src/common/constant/auth.constant";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    private readonly jwtService: JwtService,
    private emailService: EmailService
  ) {}

  async getOperatorsByCredentials(userName, password) {
    let operator = await this.userRepo.manager.findOne(Operators, {
      where: {
        user: {
          userName,
          active: true,
        }
      },
      relations: {
        user: true,
      }
    });
    if (!operator) {
      throw Error(LOGIN_ERROR_USER_NOT_FOUND);
    }
    const passwordMatch = await compare(operator.user.password, password);
    if (!passwordMatch) {
      throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
    }
    delete operator.user.password;
    return operator;
  }

  async getEmployeeUserByCredentials({userName, password }) {
    // const [findByUserName, findByOrgId] = await Promise.all([
    //   this.userRepo.manager.findOne(EmployeeUser, {where: {
    //     user: {
    //       userName,
    //       active: true,
    //     },
    //   }}),
    //   this.userRepo.manager.findOne(EmployeeUser, {where: {
    //     user: {
    //       active: true,
    //     },
    //     employee: { orgEmployeeId: userName },
    //   }}),
    // ]);

    // if(!findByUserName)
    let employeeUser = await this.userRepo.manager.findOne(EmployeeUser, {
      where: [{
        employee: { 
          active: true,
         },
        user: {
          userName,
          active: true,
        },
      },{
        user: {
          active: true,
        },
        employee: { 
          orgEmployeeId: userName,
          active: true,
         },
      }],
      relations: {
        user: true,
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
      }
    });
    if (!employeeUser && !employeeUser?.employee) {
      throw Error(LOGIN_ERROR_USER_NOT_FOUND);
    }
    const passwordMatch = await compare(employeeUser.user.password, password);
    if (!passwordMatch) {
      throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
    }
    if(!employeeUser.employee.accessGranted) {
      throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
    }
    delete employeeUser.user.password;
    return employeeUser;
  }

  async getClientsByCredentials(userName, password) {
    const client = await this.userRepo.manager.findOne(Clients, {
      where: {
        user: {
          userName,
          active: true,
        },
        active: true,
      },
      relations: {
        clientStudents: true,
        registeredByUser: true,
        updatedByUser: true,
        user: {
          userProfilePic: {
            file: true,
          },
        },
      }
    });
    if (!client) {
      throw Error(LOGIN_ERROR_USER_NOT_FOUND);
    }
    const passwordMatch = await compare(client.user.password, password);
    if (!passwordMatch) {
      throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
    }
    delete client.user.password;
    delete client.registeredByUser.password;
    if (client?.updatedByUser?.password) {
      delete client.updatedByUser.password;
    }
    const totalUnreadNotif = await this.userRepo.manager.count(Notifications, {
      where: {
        forUser: {
          userId: client.user.userId,
          active: true,
        },
        isRead: false,
      },
    });
    return {
      ...client,
      totalUnreadNotif
    };
  }

  async getByCredentials({userName, password}) {
    try {
      let user = await this.userRepo.findOne({
        where: {
          userName,
          active: true,
        },
      });
      if (!user) {
        throw Error(LOGIN_ERROR_USER_NOT_FOUND);
      }

      const passwordMatch = await compare(user.password, password);
      if (!passwordMatch) {
        throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
      }
      if(user.userType === USER_TYPE.CLIENT) {
        const client = await this.userRepo.manager.findOne(Clients, {
          where: {
            user: {
              userId: user.userId,
            }
          },
          relations: {
            clientStudents: true,
            registeredByUser: true,
            updatedByUser: true,
            user: true,
          }
        })
        delete client.user.password;
        delete client.registeredByUser.password;
        if (client?.updatedByUser?.password) {
          delete client.updatedByUser.password;
        }
        return client;
      } else if(user.userType === USER_TYPE.EMPLOYEE) {
        const employee = await this.userRepo.manager.findOne(Employees, {
          where: {
            employeeUser: {
              user: {
                userName
              }
            }
          },
          relations: {
            createdByUser: true,
            employeePosition: true,
            school: true,
            updatedByUser: true,
            employeeUser: {
              employeeUserAccess: true,
              user: true
            },
          }
        })
        if(!employee.accessGranted) {
          throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
        }
        delete employee.employeeUser?.user?.password;
        delete employee.createdByUser.password;
        if (employee?.updatedByUser?.password) {
          delete employee.updatedByUser.password;
        }
        return employee;
      } else if(user.userType === USER_TYPE.OPERATOR) {
        const operator = await this.userRepo.manager.findOne(Operators, {
          where: {
            user: {
              userId: user.userId,
            }
          },
          relations: {
            user: true,
          }
        })
        delete operator.user.password;
        return operator;
      } else {
        throw Error(LOGIN_ERROR_USERTYPE_INCORRECT);
      }
    } catch(ex) {
      throw ex;
    }
  }

  async getUserById(userId) {
    try {
      let user = await this.userRepo.findOne({
        where: {
          userId,
          active: true,
        },
      });
      if (!user) {
        throw Error(LOGIN_ERROR_USER_NOT_FOUND);
      }
      if(user.userType === USER_TYPE.EMPLOYEE) {
        const employee = await this.userRepo.manager.findOne(Employees, {
          where: {
            employeeUser: {
              user: {
                userId: user.userId,
              }
            }
          },
          relations: {
            createdByUser: true,
            employeePosition: true,
            school: true,
            updatedByUser: true,
            employeeUser: {
              user: true,
              employeeUserAccess: true,
            },
          }
        })
        if(!employee.accessGranted) {
          throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
        }
        delete employee.employeeUser.user.password;
        return employee.employeeUser?.user;
      } else if(user.userType === USER_TYPE.CLIENT) {
        const client = await this.userRepo.manager.findOne(Clients, {
          where: {
            user: {
              userId: user.userId,
            }
          },
          relations: {
            clientStudents: true,
            registeredByUser: true,
            updatedByUser: true,
            user: true,
          }
        })
        delete client.user.password;
        delete client.registeredByUser.password;
        if (client?.updatedByUser?.password) {
          delete client.updatedByUser.password;
        }
        return client.user;
      } else {
        const operator = await this.userRepo.manager.findOne(Operators, {
          where: {
            user: {
              userId: user.userId,
            }
          },
          relations: {
            user: true,
          }
        })
        delete operator.user.password;
        return operator.user;
      }
    } catch(ex) {
      throw ex;
    }
  }

  // async registerStudent(dto: RegisterStudentUserDto) {
  //   try {
  //     return await this.userRepo.manager.transaction(async (entityManager) => {
  //       const school = await entityManager.findOne(Schools, {
  //         where: {
  //           schoolId: dto.schoolId,
  //           active: true,
  //         },
  //       });
  //       if (!school) {
  //         throw Error(SCHOOLS_ERROR_NOT_FOUND);
  //       }
  
  //       let student = new Students();
  //       student.school = school;
  //       student.accessGranted = false;
  //       student.firstName = dto.firstName;
  //       student.middleInitial = dto.middleInitial;
  //       student.lastName = dto.lastName;
  //       student.fullName = `${dto.firstName} ${dto.lastName}`;
  //       student.email = dto.email;
  //       student.mobileNumber = dto.mobileNumber;
  //       student.birthDate = moment(dto.birthDate).format("YYYY-MM-DD");
  //       student.lrn = dto.lrn;
  //       student.cardNumber = dto.cardNumber;
  //       student.gender = dto.gender;
  //       student.address = dto.address;
  //       const timestamp = await entityManager
  //         .query(CONST_QUERYCURRENT_TIMESTAMP)
  //         .then((res) => {
  //           return res[0]["timestamp"];
  //         });
  //       student.registrationDate = timestamp;
  
  //       const department = await entityManager.findOne(Departments, {
  //         where: {
  //           departmentId: dto.departmentId,
  //           active: true,
  //         },
  //       });
  //       if (!department) {
  //         throw Error(STUDENTS_ERROR_NOT_FOUND);
  //       }
  //       student.department = department;
  
  //       const schoolYearLevel = await entityManager.findOne(SchoolYearLevels, {
  //         where: {
  //           school: {
  //             schoolId: dto.schoolId
  //           },
  //           active: true,
  //         },
  //       });
  //       if (!schoolYearLevel) {
  //         throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
  //       }
  //       student.schoolYearLevel = schoolYearLevel;
  
  //       student = await entityManager.save(Students, student);
  //       student.studentCode = generateIndentityCode(student.studentId);
  //       student = await entityManager.save(Students, student);
  
  //       const studentCourse = new StudentCourse();
  //       studentCourse.student = student;
  //       const course = await entityManager.findOne(Courses, {
  //         where: {
  //           courseId: dto.courseId,
  //           active: true,
  //         },
  //       });
  //       if (!course) {
  //         throw Error(COURSES_ERROR_NOT_FOUND);
  //       }
  //       studentCourse.course = course;
  //       await entityManager.save(StudentCourse, studentCourse);
  
  //       const studentSection = new StudentSection();
  //       studentSection.student = student;
  //       const section = await entityManager.findOne(Sections, {
  //         where: {
  //           sectionId: dto.sectionId,
  //           active: true,
  //         },
  //       });
  //       if (!section) {
  //         throw Error(SECTIONS_ERROR_NOT_FOUND);
  //       }
  //       studentSection.section = section;
  //       await entityManager.save(StudentSection, studentSection);
  
  //       student = await entityManager.findOne(Students, {
  //         where: {
  //           studentCode: student.studentCode,
  //           active: true,
  //         },
  //         relations: {
  //           clientStudents: {
  //             client: true,
  //           },
  //           studentCourses: {
  //             course: true,
  //           },
  //           department: true,
  //           registeredByUser: true,
  //           updatedByUser: true,
  //           school: true,
  //           schoolYearLevel: true,
  //           studentSections: {
  //             section: true,
  //           },
  //         },
  //       });
  //       delete student.registeredByUser.password;
  //       if (student?.updatedByUser?.password) {
  //         delete student.updatedByUser.password;
  //       }
  //       return student;
  //     });
  //   } catch (ex) {
  //     if (
  //       ex["message"] &&
  //       (ex["message"].includes("duplicate key") ||
  //         ex["message"].includes("violates unique constraint")) &&
  //       ex["message"].includes("u_user")
  //     ) {
  //       throw Error("Username already used!");
  //     } else {
  //       throw ex;
  //     }
  //   }
  // }

  async registerEmployee(dto: RegisterEmployeeUserDto) {
    try {
      return await this.userRepo.manager.transaction(
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
  
          let user = new Users();
          user.userType = USER_TYPE.EMPLOYEE;
          user.userName = dto.userName;
          user.password = await hash(dto.password);
          user = await entityManager.save(Users, user);
          user.userCode = generateIndentityCode(user.userId);
          user = await entityManager.save(Users, user);
  
          let employee = new Employees();
          employee.school = school;
          employee.accessGranted = false;
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
          employee.createdByUser = user;
  
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
  
          const employeePosition = await entityManager.findOne(EmployeeTitles, {
            where: {
              employeeTitleId: dto.employeeTitleId,
              school: {
                schoolId: dto.schoolId,
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
          employeeUser = await entityManager.save(EmployeeUser, employeeUser);

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
              employeeUser: {
                user: true,
                employeeUserAccess: true,
              },
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
        throw Error("Email or Username already used!");
      } else {
        throw ex;
      }
    }
  }

  async registerClient(dto: RegisterClientUserDto) {
    try {
      return await this.userRepo.manager.transaction(
        async (entityManager) => {
          const userEmailVerificationLog = await entityManager.findOne(UserEmailVerificationLog, {
            where: {
              verificationCode: dto.verificationCode,
              sessionId: dto.sessionId,
              email: dto.email
            }
          });
          if(!userEmailVerificationLog) {
            throw new Error("Your email address has not been verified yet");
          }
          if(!userEmailVerificationLog.isVerified) {
            throw new Error("Your email address has not been verified yet. Please check your email for the verification code to activate your account.");
          }
          if(userEmailVerificationLog.isUsed) {
            throw new Error("Email already used");
          }
          userEmailVerificationLog.isUsed = true;
          await entityManager.save(UserEmailVerificationLog, userEmailVerificationLog);
          let user = new Users();
          user.userType = USER_TYPE.CLIENT;
          user.userName = dto.email;
          user.password = await hash(dto.password);
          user = await entityManager.save(Users, user);
          user.userCode = generateIndentityCode(user.userId);
          user = await entityManager.save(Users, user);
  
          let client = new Clients();
          client.user = user;
          client.fullName = dto.fullName;
          client.email = dto.email;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          client.registrationDate = timestamp;
          client.registeredByUser = user;

          client = await entityManager.save(Clients, client);
          client.clientCode = generateIndentityCode(client.clientId);
          client = await entityManager.save(Clients, client);
          client = await entityManager.findOne(Clients, {
            where: {
              clientCode: client.clientCode,
              active: true,
            },
            relations: {
              clientStudents: true,
              registeredByUser: true,
              updatedByUser: true,
              user: true,
            },
          });
          delete client.user.password;
          delete client.registeredByUser.password;
          return client;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_user")
      ) {
        throw Error("Email already used!");
      } else {
        throw ex;
      }
    }
  }

  async sendEmailVerification({ email, sessionId, type }) {
    return await this.userRepo.manager.transaction(
      async (entityManager) => {
        try {
          let user = await entityManager.findOne(Users, {
            where: {
              userName: email,
              active: true,
            }
          });
          let userEmailVerificationLog;
          if(type === AUTH_USER_EMAIL_VERIFICATION_TYPE.EMAIL_VERIFICATION) {
            if(user) {
              throw new Error("Email already used");
            }
            userEmailVerificationLog = await entityManager.findOne(UserEmailVerificationLog, {
              where: {
                email,
                sessionId,
                type
              }
            });
            if(userEmailVerificationLog && userEmailVerificationLog.isUsed) {
              throw new Error("Email already used");
            }
            if(!userEmailVerificationLog) {
              userEmailVerificationLog = new UserEmailVerificationLog();
              userEmailVerificationLog.sessionId = sessionId;
              userEmailVerificationLog.email = email;
              userEmailVerificationLog.type = type;
            }
            userEmailVerificationLog.verificationCode = generateOTP();
            userEmailVerificationLog.isUsed = false;
            userEmailVerificationLog.isVerified = false;
            userEmailVerificationLog = await entityManager.save(UserEmailVerificationLog, userEmailVerificationLog);
            const sendEmailResult = await this.emailService.sendEmailVerification(email, sessionId, userEmailVerificationLog.verificationCode);
            if(!sendEmailResult) {
              throw new Error("Error sending email verification!");
            }
          }
          else if(type === AUTH_USER_EMAIL_VERIFICATION_TYPE.PASSWORD_RESET) {
            if(!user) {
              throw new Error("Email not found");
            }
            userEmailVerificationLog = await entityManager.findOne(UserEmailVerificationLog, {
              where: {
                email,
                sessionId,
                type
              }
            });
            if(!userEmailVerificationLog) {
              userEmailVerificationLog = new UserEmailVerificationLog();
              userEmailVerificationLog.sessionId = sessionId;
              userEmailVerificationLog.email = email;
              userEmailVerificationLog.type = type;
            }
            userEmailVerificationLog.verificationCode = generateOTP();
            userEmailVerificationLog.isUsed = false;
            userEmailVerificationLog.isVerified = false;
            userEmailVerificationLog = await entityManager.save(UserEmailVerificationLog, userEmailVerificationLog);
            const sendEmailResult = await this.emailService.sendResetPasswordOtp(email, sessionId, userEmailVerificationLog.verificationCode)
            if(!sendEmailResult) {
              throw new Error("Error sending email verification!");
            }
          }
          return userEmailVerificationLog;
        } catch(ex) {
          throw ex;
        }
    });
  }

  async verifyEmail({ email, sessionId, type, verificationCode }) {
    return await this.userRepo.manager.transaction(
      async (entityManager) => {
        const userEmailVerificationLog = await entityManager.findOne(UserEmailVerificationLog, {
          where: {
            sessionId: sessionId,
            email: email,
            type: type,
            verificationCode
          }
        });
        if(!userEmailVerificationLog) {
          throw new Error("Invalid verification code, please try again");
        }
        if(userEmailVerificationLog.isUsed) {
          throw new Error("Email already used");
        }
        if(userEmailVerificationLog.isVerified) {
          throw new Error("Email already verified");
        }
        await entityManager.createQueryBuilder()
        .update(UserEmailVerificationLog)
        .set({ isVerified: true })
        .where("email = :email AND sessionId = :sessionId AND type = :type", {
          email,
          sessionId,
          type,
         })
        .execute();
        return true;
    });
  }
  
  async resetPassword(dto: UpdateUserResetPasswordDto) {
    return await this.userRepo.manager.transaction(async (entityManager) => {
      const userEmailVerificationLog = await entityManager.findOne(
        UserEmailVerificationLog,
        {
          where: {
            verificationCode: dto.verificationCode,
            sessionId: dto.sessionId,
            email: dto.email,
            type: AUTH_USER_EMAIL_VERIFICATION_TYPE.PASSWORD_RESET
          },
        }
      );
      if (!userEmailVerificationLog) {
        throw new Error("Invalid verification code");
      }
      if (!userEmailVerificationLog.isVerified) {
        throw new Error(
          "Your email address has not been verified yet. Please check your email for the verification code to reset your password."
        );
      }
      if (userEmailVerificationLog.isUsed) {
        throw new Error("Invalid verification code");
      }
      
      userEmailVerificationLog.isUsed = true;
      await entityManager.save(UserEmailVerificationLog, userEmailVerificationLog);
      let user = await entityManager.findOne(Users, {
        where: {
          userName: dto.email,
          active: true,
        }
      });
      if (!user) {
        throw new Error("User not found");
      }
      user.password = await hash(dto.password);
      await entityManager.save(Users, user);

      return entityManager.findOne(Clients, {
        where: {
          user: {
            userCode: user.userCode
          }
        }
      })
    });
  }
}
