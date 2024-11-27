import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  hash,
} from "../common/utils/utils";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from 'moment-timezone';
import { COURSES_ERROR_NOT_FOUND } from "src/common/constant/courses.constant";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { EDUCATIONAL_STAGE } from "src/common/constant/educational-stage.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { SECTIONS_ERROR_NOT_FOUND } from "src/common/constant/sections.constant";
import { STRAND_ERROR_NOT_FOUND } from "src/common/constant/strand.constant";
import { STUDENTS_ERROR_NOT_FOUND } from "src/common/constant/students.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { BatchCreateStudentDto } from "src/core/dto/students/students.batch-create.dto";
import { CreateStudentDto } from "src/core/dto/students/students.create.dto";
import {
  UpdateStudentUserProfileDto,
  UpdateStudentUserDto,
  UpdateStudentDto,
} from "src/core/dto/students/students.update.dto";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { Courses } from "src/db/entities/Courses";
import { Departments } from "src/db/entities/Departments";
import { ClientStudent } from "src/db/entities/ClientStudent";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { Schools } from "src/db/entities/Schools";
import { Sections } from "src/db/entities/Sections";
import { Strands } from "src/db/entities/Strands";
import { StudentCourse } from "src/db/entities/StudentCourse";
import { StudentSection } from "src/db/entities/StudentSection";
import { StudentStrand } from "src/db/entities/StudentStrand";
import { Students } from "src/db/entities/Students";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { Clients } from "src/db/entities/Clients";
import { CLIENTS_ERROR_NOT_FOUND } from "src/common/constant/clients.constant";

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Students)
    private readonly studentRepo: Repository<Students>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.studentRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          clientStudents: true,
          studentCourse: {
            course: true,
          },
          studentStrand: {
            strand: true,
          },
          department: true,
          registeredByUser: true,
          updatedByUser: true,
          school: true,
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
        },
        skip,
        take,
        order,
      }),
      this.studentRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x.registeredByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
  }

  async getByCode(studentCode) {
    const res = await this.studentRepo.findOne({
      where: {
        studentCode,
        active: true,
      },
      relations: {
        clientStudents: {
          client: true,
        },
        studentCourse: {
          course: true,
        },
        studentStrand: {
          strand: true,
        },
        department: true,
        registeredByUser: true,
        updatedByUser: true,
        school: true,
        schoolYearLevel: true,
        studentSection: {
          section: true,
        },
      },
    });

    if (!res) {
      throw Error(USER_ERROR_USER_NOT_FOUND);
    }
    res.clientStudents = res.clientStudents.filter((x) => x.active);
    delete res.registeredByUser.password;
    if (res?.updatedByUser?.password) {
      delete res.updatedByUser.password;
    }
    return res;
  }

  async getByOrgStudentId(orgStudentId) {
    const res = await this.studentRepo.findOne({
      where: {
        orgStudentId,
        active: true,
      },
      relations: {
        clientStudents: {
          client: true,
        },
        studentCourse: {
          course: true,
        },
        studentStrand: {
          strand: true,
        },
        department: true,
        registeredByUser: true,
        updatedByUser: true,
        school: true,
        schoolYearLevel: true,
        studentSection: {
          section: true,
        },
      },
    });

    if (!res) {
      throw Error(USER_ERROR_USER_NOT_FOUND);
    }
    res.clientStudents = res.clientStudents.filter((x) => x.active);
    delete res.registeredByUser.password;
    if (res?.updatedByUser?.password) {
      delete res.updatedByUser.password;
    }
    return res;
  }

  async getByCardNumber(cardNumber) {
    const res = await this.studentRepo.findOne({
      where: {
        cardNumber,
        active: true,
      },
      relations: {
        clientStudents: {
          client: true,
        },
        studentCourse: {
          course: true,
        },
        studentStrand: {
          strand: true,
        },
        department: true,
        registeredByUser: true,
        updatedByUser: true,
        school: true,
        schoolYearLevel: true,
        studentSection: {
          section: true,
        },
      },
    });

    if (!res) {
      throw Error(USER_ERROR_USER_NOT_FOUND);
    }
    res.clientStudents = res.clientStudents.filter((x) => x.active);
    delete res.registeredByUser.password;
    if (res?.updatedByUser?.password) {
      delete res.updatedByUser.password;
    }
    return res;
  }

  async create(dto: CreateStudentDto) {
    try {
      return await this.studentRepo.manager.transaction(
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
          let student = new Students();
          student.school = school;
          student.accessGranted = true;
          student.firstName = dto.firstName;
          student.middleInitial = dto.middleInitial;
          student.lastName = dto.lastName;
          if (dto.middleInitial && dto.middleInitial !== "") {
            student.fullName = `${dto.firstName} ${dto.middleInitial} ${dto.lastName}`;
          } else {
            student.fullName = `${dto.firstName} ${dto.lastName}`;
          }
          student.email = dto.email;
          student.mobileNumber = dto.mobileNumber;
          student.cardNumber = dto.cardNumber;
          student.address = dto.address;
          student.orgStudentId = dto.orgStudentId;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          student.registrationDate = timestamp;

          const registeredByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.registeredByUserId,
              active: true,
            },
          });
          if (!registeredByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          student.registeredByUser = registeredByUser;

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
          student.department = department;

          const schoolYearLevel = await entityManager.findOne(
            SchoolYearLevels,
            {
              where: {
                schoolYearLevelId: dto.schoolYearLevelId,
                school: {
                  schoolId: dto.schoolId,
                },
                active: true,
              },
            }
          );
          if (!schoolYearLevel) {
            throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
          }
          student.schoolYearLevel = schoolYearLevel;

          student = await entityManager.save(Students, student);
          student.studentCode = generateIndentityCode(student.studentId);
          student = await entityManager.save(Students, student);

          if (dto.sectionId && dto.sectionId !== "") {
            const studentSection = new StudentSection();
            studentSection.student = student;
            const section = await entityManager.findOne(Sections, {
              where: {
                sectionId: dto.sectionId,
                active: true,
              },
            });
            if (!section) {
              throw Error(SECTIONS_ERROR_NOT_FOUND);
            }
            studentSection.section = section;
            await entityManager.save(StudentSection, studentSection);
          }

          if (schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.COLLEGE) {
            const studentCourse = new StudentCourse();
            studentCourse.student = student;
            const course = await entityManager.findOne(Courses, {
              where: {
                courseId: dto.courseId,
                active: true,
              },
            });
            if (!course) {
              throw Error(COURSES_ERROR_NOT_FOUND);
            }
            studentCourse.course = course;
            await entityManager.save(StudentCourse, studentCourse);
          } else if (
            schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.SENIOR
          ) {
            const studentStrand = new StudentStrand();
            studentStrand.student = student;
            const strand = await entityManager.findOne(Strands, {
              where: {
                strandId: dto.strandId,
                active: true,
              },
            });
            if (!strand) {
              throw Error(STRAND_ERROR_NOT_FOUND);
            }
            studentStrand.strand = strand;
            await entityManager.save(StudentStrand, studentStrand);
          }

          student = await entityManager.findOne(Students, {
            where: {
              studentCode: student.studentCode,
              active: true,
            },
            relations: {
              clientStudents: {
                client: true,
              },
              studentCourse: {
                course: true,
              },
              studentStrand: {
                strand: true,
              },
              department: true,
              registeredByUser: true,
              updatedByUser: true,
              school: true,
              schoolYearLevel: true,
              studentSection: {
                section: true,
              },
            },
          });
          delete student.registeredByUser.password;
          return student;
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
        ex["message"].includes("u_students_card")
      ) {
        throw Error("Student Card Number already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_student_orgstudentid")
      ) {
        throw Error("Student Id already used!");
      } else {
        throw ex;
      }
    }
  }

  async createBatch(dtos: BatchCreateStudentDto[]) {
    try {
      return await this.studentRepo.manager.transaction(
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

              let student = await entityManager.findOne(Students, {
                where: {
                  orgStudentId: dto.orgStudentId,
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  active: true,
                },
              });
              if (!student) {
                student = new Students();
              }
              student.school = school;
              student.accessGranted = true;
              student.firstName = dto.firstName;
              student.middleInitial = dto.middleInitial;
              student.lastName = dto.lastName;
              if (dto.middleInitial && dto.middleInitial !== "") {
                student.fullName = `${dto.firstName} ${dto.middleInitial} ${dto.lastName}`;
              } else {
                student.fullName = `${dto.firstName} ${dto.lastName}`;
              }
              student.email = dto.email;
              student.mobileNumber = dto.mobileNumber;
              student.address = dto.address;
              if (dto.cardNumber && dto.cardNumber !== "") {
                student.cardNumber = dto.cardNumber;
              }
              if (dto.orgStudentId && dto.orgStudentId !== "") {
                student.orgStudentId = dto.orgStudentId;
              } else {
                //create temporary id for easy filter
                student.orgStudentId = `${dto.orgSchoolCode}${dto.firstName
                  ?.replace(/\s+/g, "")
                  .toUpperCase()}${dto.lastName
                  ?.replace(/\s+/g, "")
                  .toUpperCase()}`;
              }
              const timestamp = await entityManager
                .query(CONST_QUERYCURRENT_TIMESTAMP)
                .then((res) => {
                  return res[0]["timestamp"];
                });
              student.registrationDate = timestamp;

              const registeredByUser = await entityManager.findOne(Users, {
                where: {
                  userId: dto.registeredByUserId,
                  active: true,
                },
              });
              if (!registeredByUser) {
                throw Error(USER_ERROR_USER_NOT_FOUND);
              }
              student.registeredByUser = registeredByUser;

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
                  if (dto.orgStudentId && dto.orgStudentId !== "") {
                    warning.push({
                      orgStudentId: dto.orgStudentId,
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
                student.department = department;
              } else {
                if (dto.orgStudentId && dto.orgStudentId !== "") {
                  warning.push({
                    orgStudentId: dto.orgStudentId,
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
              let schoolYearLevel: SchoolYearLevels;
              if (dto.schoolYearLevelName && dto.schoolYearLevelName !== "") {
                schoolYearLevel = (await entityManager
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
                  if (dto.orgStudentId && dto.orgStudentId !== "") {
                    warning.push({
                      orgStudentId: dto.orgStudentId,
                      refId: dto.refId,
                      comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.schoolYearLevelName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.schoolYearLevelName}`,
                    });
                  }
                  hasWarning = true;
                }
                student.schoolYearLevel = schoolYearLevel;
              } else {
                if (dto.orgStudentId && dto.orgStudentId !== "") {
                  warning.push({
                    orgStudentId: dto.orgStudentId,
                    refId: dto.refId,
                    comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.schoolYearLevelName}`,
                  });
                } else {
                  warning.push({
                    refId: dto.refId,
                    comments: `${SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND} ${dto.schoolYearLevelName}`,
                  });
                }
                hasWarning = true;
              }

              student = await entityManager.save(Students, student);
              student.studentCode = generateIndentityCode(student.studentId);
              student = await entityManager.save(Students, student);

              if (dto.sectionName && dto.sectionName !== "") {
                const studentSection = new StudentSection();
                studentSection.student = student;
                const section: Sections = (await entityManager
                  .createQueryBuilder("Sections", "sec")
                  .leftJoinAndSelect("sec.school", "s")
                  .where(
                    "trim(upper(sec.sectionName)) = trim(upper(:sectionName)) AND " +
                      "s.orgSchoolCode = :orgSchoolCode"
                  )
                  .setParameters({
                    sectionName: dto.sectionName,
                    orgSchoolCode: dto.orgSchoolCode,
                  })
                  .getOne()) as any;
                if (!section) {
                  if (dto.orgStudentId && dto.orgStudentId !== "") {
                    warning.push({
                      orgStudentId: dto.orgStudentId,
                      refId: dto.refId,
                      comments: `${SECTIONS_ERROR_NOT_FOUND} ${dto.sectionName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${SECTIONS_ERROR_NOT_FOUND} ${dto.sectionName}`,
                    });
                  }
                  hasWarning = true;
                }
                studentSection.section = section;
                await entityManager.save(StudentSection, studentSection);
              } else {
                if (dto.orgStudentId && dto.orgStudentId !== "") {
                  warning.push({
                    orgStudentId: dto.orgStudentId,
                    refId: dto.refId,
                    comments: `${SECTIONS_ERROR_NOT_FOUND} ${dto.sectionName}`,
                  });
                } else {
                  warning.push({
                    refId: dto.refId,
                    comments: `${SECTIONS_ERROR_NOT_FOUND} ${dto.sectionName}`,
                  });
                }
                hasWarning = true;
              }

              if (
                schoolYearLevel &&
                schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.COLLEGE
              ) {
                if (dto.courseName && dto.courseName !== "") {
                  const studentCourse = new StudentCourse();
                  studentCourse.student = student;
                  const course: Courses = (await entityManager
                    .createQueryBuilder("Courses", "c")
                    .leftJoinAndSelect("c.school", "s")
                    .where(
                      "trim(upper(c.name)) = trim(upper(:courseName)) AND " +
                        "s.orgSchoolCode = :orgSchoolCode"
                    )
                    .setParameters({
                      courseName: dto.courseName,
                      orgSchoolCode: dto.orgSchoolCode,
                    })
                    .getOne()) as any;
                  if (!course) {
                    if (dto.orgStudentId && dto.orgStudentId !== "") {
                      warning.push({
                        orgStudentId: dto.orgStudentId,
                        refId: dto.refId,
                        comments: `${COURSES_ERROR_NOT_FOUND} ${dto.courseName}`,
                      });
                    } else {
                      warning.push({
                        refId: dto.refId,
                        comments: `${COURSES_ERROR_NOT_FOUND} ${dto.courseName}`,
                      });
                    }
                    hasWarning = true;
                  }
                  studentCourse.course = course;
                  await entityManager.save(StudentCourse, studentCourse);
                } else {
                  if (dto.orgStudentId && dto.orgStudentId !== "") {
                    warning.push({
                      orgStudentId: dto.orgStudentId,
                      refId: dto.refId,
                      comments: `${COURSES_ERROR_NOT_FOUND} ${dto.courseName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${COURSES_ERROR_NOT_FOUND} ${dto.courseName}`,
                    });
                  }
                  hasWarning = true;
                }
              } else if (
                schoolYearLevel &&
                schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.SENIOR
              ) {
                if (dto.strandName && dto.strandName !== "") {
                  const studentStrand = new StudentStrand();
                  studentStrand.student = student;
                  const strand: Strands = (await entityManager
                    .createQueryBuilder("Strands", "st")
                    .leftJoinAndSelect("st.school", "s")
                    .where(
                      "trim(upper(st.name)) = trim(upper(:strandName)) AND " +
                        "s.orgSchoolCode = :orgSchoolCode"
                    )
                    .setParameters({
                      strandName: dto.strandName,
                      orgSchoolCode: dto.orgSchoolCode,
                    })
                    .getOne()) as any;
                  if (!strand) {
                    if (dto.orgStudentId && dto.orgStudentId !== "") {
                      warning.push({
                        orgStudentId: dto.orgStudentId,
                        refId: dto.refId,
                        comments: `${STRAND_ERROR_NOT_FOUND} ${dto.strandName}`,
                      });
                    } else {
                      warning.push({
                        refId: dto.refId,
                        comments: `${STRAND_ERROR_NOT_FOUND} ${dto.strandName}`,
                      });
                    }
                    hasWarning = true;
                  }
                  studentStrand.strand = strand;
                  await entityManager.save(StudentStrand, studentStrand);
                } else {
                  if (dto.orgStudentId && dto.orgStudentId !== "") {
                    warning.push({
                      orgStudentId: dto.orgStudentId,
                      refId: dto.refId,
                      comments: `${STRAND_ERROR_NOT_FOUND} ${dto.strandName}`,
                    });
                  } else {
                    warning.push({
                      refId: dto.refId,
                      comments: `${STRAND_ERROR_NOT_FOUND} ${dto.strandName}`,
                    });
                  }
                  hasWarning = true;
                }
              }

              student = await entityManager.findOne(Students, {
                where: {
                  studentCode: student.studentCode,
                  active: true,
                },
                relations: {
                  clientStudents: {
                    client: true,
                  },
                  studentCourse: {
                    course: true,
                  },
                  studentStrand: {
                    strand: true,
                  },
                  department: true,
                  registeredByUser: true,
                  updatedByUser: true,
                  school: true,
                  schoolYearLevel: true,
                  studentSection: {
                    section: true,
                  },
                },
              });
              delete student.registeredByUser.password;
              if (!hasWarning) {
                success.push({
                  orgStudentId: dto.orgStudentId,
                  refId: dto.refId,
                });
              }
            } catch (ex) {
              failed.push({
                orgStudentId: dto.orgStudentId,
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

  // async updateProfile(studentCode, dto: UpdateStudentUserProfileDto) {
  //   return await this.studentRepo.manager.transaction(async (entityManager) => {
  //     let student = await entityManager.findOne(Students, {
  //       where: {
  //         studentCode,
  //         active: true,
  //       },
  //       relations: {
  //         clientStudents: {
  //           client: true,
  //         },
  //         studentCourse: {
  //           course: true,
  //         },
  //         department: true,
  //         registeredByUser: true,
  //         updatedByUser: true,
  //         school: true,
  //         schoolYearLevel: true,
  //         studentSection: {
  //           section: true,
  //         },
  //       },
  //     });

  //     if (!student) {
  //       throw Error(STUDENTS_ERROR_NOT_FOUND);
  //     }

  //     student.firstName = dto.firstName;
  //     student.middleInitial = dto.middleInitial;
  //     student.lastName = dto.lastName;
  //     student.fullName = `${dto.firstName} ${dto.lastName}`;
  //     student.email = dto.email;
  //     student.mobileNumber = dto.mobileNumber;
  //     student.birthDate = moment(dto.birthDate).format("YYYY-MM-DD");
  //     student.lrn = dto.lrn;
  //     student.cardNumber = dto.cardNumber;
  //     student.gender = dto.gender;
  //     student.address = dto.address;
  //     const timestamp = await entityManager
  //       .query(CONST_QUERYCURRENT_TIMESTAMP)
  //       .then((res) => {
  //         return res[0]["timestamp"];
  //       });
  //     student.updatedDate = timestamp;
  //     student.updatedByUser = student.user;

  //     const department = await entityManager.findOne(Departments, {
  //       where: {
  //         departmentId: dto.departmentId,
  //         active: true,
  //       },
  //     });
  //     if (!department) {
  //       throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
  //     }
  //     student.department = department;

  //     const schoolYearLevel = await entityManager.findOne(SchoolYearLevels, {
  //       where: {
  //         schoolYearLevelId: dto.schoolYearLevelId,
  //         school: {
  //           schoolId: student.school.schoolId,
  //         },
  //         active: true,
  //       },
  //     });
  //     if (!schoolYearLevel) {
  //       throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
  //     }
  //     student.schoolYearLevel = schoolYearLevel;

  //     student = await entityManager.save(Students, student);

  //     let studentCourse = await entityManager.findOne(StudentCourse, {
  //       where: {
  //         student: {
  //           studentId: student.studentId,
  //         },
  //       },
  //     });
  //     if (!studentCourse) {
  //       studentCourse = new StudentCourse();
  //       studentCourse.student = student;
  //     }
  //     const course = await entityManager.findOne(Courses, {
  //       where: {
  //         courseId: dto.courseId,
  //         active: true,
  //       },
  //     });
  //     if (!course) {
  //       throw Error(COURSES_ERROR_NOT_FOUND);
  //     }
  //     studentCourse.course = course;
  //     await entityManager.save(StudentCourse, studentCourse);

  //     let studentSection = await entityManager.findOne(StudentSection, {
  //       where: {
  //         student: {
  //           studentId: student.studentId,
  //         },
  //       },
  //     });
  //     if (!studentSection) {
  //       studentSection = new StudentSection();
  //       studentSection.student = student;
  //     }
  //     const section = await entityManager.findOne(Sections, {
  //       where: {
  //         sectionId: dto.sectionId,
  //         active: true,
  //       },
  //     });
  //     if (!section) {
  //       throw Error(SECTIONS_ERROR_NOT_FOUND);
  //     }
  //     studentSection.section = section;
  //     await entityManager.save(StudentSection, studentSection);

  //     student = await entityManager.findOne(Students, {
  //       where: {
  //         studentCode,
  //         active: true,
  //       },
  //       relations: {
  //         clientStudents: {
  //           client: true,
  //         },
  //         studentCourse: {
  //           course: true,
  //         },
  //         department: true,
  //         registeredByUser: true,
  //         updatedByUser: true,
  //         school: true,
  //         schoolYearLevel: true,
  //         user: true,
  //         studentSection: {
  //           section: true,
  //         },
  //       },
  //     });
  //     delete student.user.password;
  //     delete student.registeredByUser.password;
  //     if (student?.updatedByUser?.password) {
  //       delete student.updatedByUser.password;
  //     }
  //     return student;
  //   });
  // }

  async update(studentCode, dto: UpdateStudentDto) {
    return await this.studentRepo.manager.transaction(async (entityManager) => {
      let student = await entityManager.findOne(Students, {
        where: {
          studentCode,
          active: true,
        },
        relations: {
          studentCourse: {
            course: true,
          },
          studentStrand: {
            strand: true,
          },
          department: true,
          registeredByUser: true,
          updatedByUser: true,
          school: true,
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
        },
      });

      if (!student) {
        throw Error(STUDENTS_ERROR_NOT_FOUND);
      }

      student.firstName = dto.firstName;
      student.middleInitial = dto.middleInitial;
      student.lastName = dto.lastName;
      if (dto.middleInitial && dto.middleInitial !== "") {
        student.fullName = `${dto.firstName} ${dto.middleInitial} ${dto.lastName}`;
      } else {
        student.fullName = `${dto.firstName} ${dto.lastName}`;
      }
      student.email = dto.email;
      student.mobileNumber = dto.mobileNumber;
      student.cardNumber = dto.cardNumber;
      student.address = dto.address;
      student.orgStudentId = dto.orgStudentId;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      student.updatedDate = timestamp;

      const updatedByUser = await entityManager.findOne(Users, {
        where: {
          userId: dto.updatedByUserId,
          active: true,
        },
      });
      if (!updatedByUser) {
        throw Error(USER_ERROR_USER_NOT_FOUND);
      }
      student.updatedByUser = updatedByUser;

      const department = await entityManager.findOne(Departments, {
        where: {
          departmentId: dto.departmentId,
          active: true,
        },
      });
      if (!department) {
        throw Error(DEPARTMENTS_ERROR_NOT_FOUND);
      }
      student.department = department;

      const schoolYearLevel = await entityManager.findOne(SchoolYearLevels, {
        where: {
          schoolYearLevelId: dto.schoolYearLevelId,
          school: {
            schoolId: student.school.schoolId,
          },
          active: true,
        },
      });
      if (!schoolYearLevel) {
        throw Error(SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND);
      }
      student.schoolYearLevel = schoolYearLevel;

      student = await entityManager.save(Students, student);

      let studentSection = await entityManager.findOne(StudentSection, {
        where: {
          student: {
            studentId: student.studentId,
          },
        },
      });
      if (studentSection) {
        await entityManager.delete(StudentSection, studentSection);
      } else {
        studentSection = new StudentSection();
      }
      const section = await entityManager.findOne(Sections, {
        where: {
          sectionId: dto.sectionId,
          active: true,
        },
      });
      if (!section) {
        throw Error(SECTIONS_ERROR_NOT_FOUND);
      }
      studentSection.section = section;
      await entityManager.save(StudentSection, studentSection);

      let [studentCourse, studentStrand] = await Promise.all([
        entityManager.findOne(StudentCourse, {
          where: {
            student: {
              studentId: student.studentId,
            },
          },
        }),
        entityManager.findOne(StudentStrand, {
          where: {
            student: {
              studentId: student.studentId,
            },
          },
        }),
      ]);
      //Check to see if the student has previously taken the course and then delete it.
      if (studentCourse) {
        await entityManager.delete(StudentCourse, studentCourse);
      }
      //Check to see if the student has previously taken the strand and then delete it.
      if (studentStrand) {
        await entityManager.delete(StudentStrand, studentStrand);
      }

      if (schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.COLLEGE) {
        studentCourse = new StudentCourse();
        studentCourse.student = student;
        const course = await entityManager.findOne(Courses, {
          where: {
            courseId: dto.courseId,
            active: true,
          },
        });
        if (!course) {
          throw Error(COURSES_ERROR_NOT_FOUND);
        }
        studentCourse.course = course;
        await entityManager.save(StudentCourse, studentCourse);
      } else if (
        schoolYearLevel.educationalStage === EDUCATIONAL_STAGE.SENIOR
      ) {
        studentStrand = new StudentStrand();
        studentStrand.student = student;
        const strand = await entityManager.findOne(Strands, {
          where: {
            strandId: dto.strandId,
            active: true,
          },
        });
        if (!strand) {
          throw Error(COURSES_ERROR_NOT_FOUND);
        }
        studentStrand.strand = strand;
        await entityManager.save(StudentStrand, studentStrand);
      }

      student = await entityManager.findOne(Students, {
        where: {
          studentCode,
          active: true,
        },
        relations: {
          clientStudents: {
            client: true,
          },
          studentCourse: {
            course: true,
          },
          studentStrand: {
            strand: true,
          },
          department: true,
          registeredByUser: true,
          updatedByUser: true,
          school: true,
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
        },
      });

      delete student.registeredByUser.password;
      if (student?.updatedByUser?.password) {
        delete student.updatedByUser.password;
      }
      return student;
    });
  }

  // async resetPassword(studentCode, dto: UpdateUserResetPasswordDto) {
  //   return await this.studentRepo.manager.transaction(async (entityManager) => {
  //     let student = await entityManager.findOne(Students, {
  //       where: {
  //         studentCode,
  //         active: true,
  //       },
  //       relations: {
  //         user: true,
  //       },
  //     });

  //     if (!student) {
  //       throw Error(STUDENTS_ERROR_NOT_FOUND);
  //     }

  //     const user = student.user;
  //     user.password = await hash(dto.password);
  //     await entityManager.save(Users, user);
  //     student = await entityManager.findOne(Students, {
  //       where: {
  //         studentCode,
  //         active: true,
  //       },
  //       relations: {
  //         clientStudents: {
  //           client: true,
  //         },
  //         studentCourse: {
  //           course: true,
  //         },
  //         department: true,
  //         registeredByUser: true,
  //         updatedByUser: true,
  //         school: true,
  //         schoolYearLevel: true,
  //         user: true,
  //         studentSection: {
  //           section: true,
  //         },
  //       },
  //     });
  //     delete student.user.password;
  //     delete student.registeredByUser.password;
  //     if (student?.updatedByUser?.password) {
  //       delete student.updatedByUser.password;
  //     }
  //     return student;
  //   });
  // }

  async delete(studentCode) {
    return await this.studentRepo.manager.transaction(async (entityManager) => {
      let student = await entityManager.findOne(Students, {
        where: {
          studentCode,
          active: true,
        },
        relations: {},
      });

      if (!student) {
        throw Error(STUDENTS_ERROR_NOT_FOUND);
      }

      student.active = false;
      await entityManager.save(Students, student);
      // const user = student.user;
      // user.active = false;
      // await entityManager.save(Users, user);
      student = await entityManager.findOne(Students, {
        where: {
          studentCode,
        },
        relations: {
          clientStudents: {
            client: true,
          },
          studentCourse: {
            course: true,
          },
          studentStrand: {
            strand: true,
          },
          department: true,
          registeredByUser: true,
          updatedByUser: true,
          school: true,
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
        },
      });
      delete student.registeredByUser.password;
      if (student?.updatedByUser?.password) {
        delete student.updatedByUser.password;
      }
      return student;
    });
  }

  async approveAccessRequest(studentCode) {
    return await this.studentRepo.manager.transaction(async (entityManager) => {
      let student = await entityManager.findOne(Students, {
        where: {
          studentCode,
          active: true,
        },
        relations: {},
      });

      if (!student) {
        throw Error(STUDENTS_ERROR_NOT_FOUND);
      }

      student.accessGranted = true;
      await entityManager.save(Students, student);
      student = await entityManager.findOne(Students, {
        where: {
          studentCode,
        },
        relations: {
          clientStudents: {
            client: true,
          },
          studentCourse: {
            course: true,
          },
          studentStrand: {
            strand: true,
          },
          department: true,
          registeredByUser: true,
          updatedByUser: true,
          school: true,
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
        },
      });
      delete student.registeredByUser.password;
      if (student?.updatedByUser?.password) {
        delete student.updatedByUser.password;
      }
      return student;
    });
  }
}
