import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment-timezone";
import {
  ANNOUNCEMENT_ACTIONS,
  ANNOUNCEMENT_AUDIENCE_MODE,
  ANNOUNCEMENT_AUDIENCE_TYPE,
  ANNOUNCEMENTS_ERROR_CANT_UPDATE_SENDING,
  ANNOUNCEMENTS_ERROR_NOT_FOUND,
  ANNOUNCEMENTS_STATUS,
  TARGET_RECIPIENT_TYPE,
} from "src/common/constant/announcements.constant";
import { DateConstant } from "src/common/constant/date.constant";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  normalizeCacheKey,
} from "src/common/utils/utils";
import { CreateAnnouncementDto } from "src/core/dto/announcements/announcements.create.dto";
import { UpdateAnnouncementDto } from "src/core/dto/announcements/announcements.update.dto";
import { Announcements } from "src/db/entities/Announcements";
import { Departments } from "src/db/entities/Departments";
import { Schools } from "src/db/entities/Schools";
import { Students } from "src/db/entities/Students";
import { Users } from "src/db/entities/Users";
import { Connection, EntityManager, In, Not, Repository } from "typeorm";
import { JobsService } from "./jobs.service";
import { CronTime } from "cron";
import { Employees } from "src/db/entities/Employees";
import { EDUCATIONAL_STAGE } from "src/common/constant/educational-stage.constant";
import { EmployeeTitles } from "src/db/entities/EmployeeTitles";
import { SchoolYearLevels } from "src/db/entities/SchoolYearLevels";
import { Sections } from "src/db/entities/Sections";
import { AnnouncementVisitLogs } from "src/db/entities/AnnouncementVisitLogs";
import { CustomCacheManagerService } from "./custom-cache-manager.service";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcements)
    private readonly announcementsRepo: Repository<Announcements>,
    @InjectRepository(AnnouncementVisitLogs)
    private readonly announcementVisitLogsRepo: Repository<AnnouncementVisitLogs>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private connection: Connection,
    private jobsService: JobsService,
    private customCacheManagerService: CustomCacheManagerService
  ) {}

  async getAnnouncementsPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);
    const school =
      condition.school?.schoolCode && condition.school?.schoolCode !== ""
        ? condition.school?.schoolCode
        : condition.school?.schoold;
    const cacheKey = normalizeCacheKey(
      `announcements_page${school && school !== "" ? "_" + school : ""}`,
      {
        condition,
        skip,
        take,
        order,
      }
    );
    const cachedData = await this.customCacheManagerService.get<any>(cacheKey);

    if (cachedData) {
      return cachedData; // Return cached result
    }

    const [results, total] = await Promise.all([
      this.announcementsRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
          school: true,
        },
        skip,
        take,
        order,
      }),
      this.announcementsRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    const final = {
      results: results.map((x) => {
        delete x.createdByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
    await this.customCacheManagerService.set(cacheKey, final, 300);
    return final;
  }

  async getByCode(announcementCode, schoolCode, userCode = null) {
    const cacheKey = `announcements_${announcementCode}`;
    let result = await this.customCacheManagerService.get<any>(cacheKey);

    if (!result) {
      result = await this.announcementsRepo.findOne({
        where: {
          announcementCode,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
          school: true,
        },
      });
      if (!result) {
        throw Error(ANNOUNCEMENTS_ERROR_NOT_FOUND);
      }
      delete result.createdByUser.password;
      if (result?.updatedByUser?.password) {
        delete result.updatedByUser.password;
      }
      if (
        result &&
        result?.audienceMode === "SEND_TO_ONE" &&
        result.targetRecipient &&
        result.targetRecipient["id"] &&
        result.targetRecipient["type"]
      ) {
        const { id, type } = result.targetRecipient as any;
        let recipient;
        if (type === "EMPLOYEE") {
          recipient = await this.connection.manager.findOne(Employees, {
            where: {
              employeeId: id,
              active: true,
            },
          });
        } else {
          recipient = await this.connection.manager.findOne(Students, {
            where: {
              studentId: id,
              active: true,
            },
          });
        }
        if (recipient) {
          result.targetRecipient = {
            id,
            type,
            fullName: recipient.fullName,
          };
        }
      }
    }

    if (userCode) {
      const announcementVisitLogs =
        await this.customCacheManagerService.get<AnnouncementVisitLogs>(
          `announcement_visit_${userCode}_${announcementCode}`
        );

      if (!announcementVisitLogs) {
        const user = await this.usersRepo.findOne({
          where: {
            userCode: userCode ? userCode : "",
            active: true,
          },
        });
        if (result && user) {
          let logs = await this.announcementVisitLogsRepo.findOne({
            where: {
              announcement: {
                announcementCode: result.announcementCode,
              },
              user: {
                userCode,
              },
            },
          });
          if (!logs) {
            logs = new AnnouncementVisitLogs();
            logs.firstDateVisited = moment.tz("utc").toDate();
            logs.announcement = result;
            const count = 1;
            logs.visitCount = count.toString();
            logs.lastDateVisited = moment.tz("utc").toDate();
            logs.user = user;
          } else {
            logs.lastDateVisited = moment.tz("utc").toDate();
            logs.announcement = result;
            const count = !isNaN(Number(logs.visitCount))
              ? Number(logs.visitCount) + 1
              : 1;
            logs.visitCount = count.toString();
          }
          await this.announcementVisitLogsRepo.save(logs);
          await this.customCacheManagerService.set(
            `announcement_visit_${userCode}_${announcementCode}`,
            logs,
            600
          );
        }
      }
    }

    await this.customCacheManagerService.set(cacheKey, result, 300);
    return result;
  }

  async create(dto: CreateAnnouncementDto) {
    try {
      return await this.announcementsRepo.manager.transaction(
        async (entityManager) => {
          let announcements = new Announcements();
          announcements.title = dto.title;
          announcements.description = dto.description;
          if (
            dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY &&
            dto.audienceType &&
            dto.audienceType.length > 0
          ) {
            announcements.audienceType = dto.audienceType;
          } else if (
            (!dto.audienceType || dto.audienceType.length === 0) &&
            dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY
          ) {
            throw new HttpException(
              "Invalid audienceType",
              HttpStatus.BAD_REQUEST
            );
          } else if (
            dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_ONE
          ) {
            if (
              !dto.targetRecipient ||
              !dto.targetRecipient.type ||
              !dto.targetRecipient.id ||
              dto.targetRecipient.id === ""
            ) {
              throw new HttpException(
                "Invalid target recipient",
                HttpStatus.BAD_REQUEST
              );
            }
            if (dto.targetRecipient.type === TARGET_RECIPIENT_TYPE.EMPLOYEE) {
              const employee = await entityManager.findOne(Employees, {
                where: {
                  employeeId: dto.targetRecipient.id,
                  active: true,
                  school: {
                    schoolId: dto.schoolId,
                  },
                },
              });

              if (!employee) {
                throw new HttpException(
                  "Invalid target recipient employee",
                  HttpStatus.BAD_REQUEST
                );
              }
            }
            if (dto.targetRecipient.type === TARGET_RECIPIENT_TYPE.STUDENT) {
              const student = await entityManager.findOne(Students, {
                where: {
                  studentId: dto.targetRecipient.id,
                  active: true,
                  school: {
                    schoolId: dto.schoolId,
                  },
                },
              });

              if (!student) {
                throw new HttpException(
                  "Invalid target recipient student",
                  HttpStatus.BAD_REQUEST
                );
              }
            }
            announcements.targetRecipient = dto.targetRecipient;
          }
          announcements.audienceMode = dto.audienceMode;
          // announcements.employeeFilter = dto.employeeFilter;
          // announcements.studentPrimaryFilter = dto.studentPrimaryFilter;
          // announcements.studentJuniorFilter = dto.studentJuniorFilter;
          // announcements.studentSeniorFilter = dto.studentSeniorFilter;
          announcements.targetDateTime = moment(dto.targetDateTime)
            .tz("utc")
            .toDate();
          announcements.isSchedule = dto.isSchedule;
          announcements.createdDate = moment.tz("utc").toDate();

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          announcements.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          announcements.createdByUser = createdByUser;
          announcements = await entityManager.save(announcements);
          announcements.announcementCode = generateIndentityCode(
            announcements.announcementId
          );
          announcements = await entityManager.save(
            Announcements,
            announcements
          );
          delete announcements.createdByUser.password;
          const pageCacheKey = `announcements_page_${announcements?.school?.schoolCode}*`;
          await await this.customCacheManagerService.del(pageCacheKey);
          return announcements;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_announcement")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async update(
    announcementCode,
    dto: UpdateAnnouncementDto,
    schoolCode: string
  ) {
    try {
      return await this.announcementsRepo.manager.transaction(
        async (entityManager) => {
          let announcements: Announcements;
          const cacheKey = `announcements_${announcementCode}`;
          announcements =
            await this.customCacheManagerService.get<Announcements>(cacheKey);
          if (!announcements) {
            announcements = await entityManager.findOne(Announcements, {
              where: {
                announcementCode,
                active: true,
              },
              relations: {
                createdByUser: true,
                updatedByUser: true,
                school: true,
              },
            });
            if (!announcements) {
              throw Error(ANNOUNCEMENTS_ERROR_NOT_FOUND);
            }
          }
          if (
            announcements.status !== ANNOUNCEMENTS_STATUS.DRAFT &&
            announcements.status !== ANNOUNCEMENTS_STATUS.PENDING
          ) {
            throw Error(`Cannot edit ${announcements.status} Announcement!`);
          }
          announcements.updatedDate = moment.tz("utc").toDate();

          let updatedByUser = await this.customCacheManagerService.get<Users>(
            `user_${dto.updatedByUserId}`
          );
          if (!updatedByUser) {
            updatedByUser = await entityManager.findOne(Users, {
              where: {
                userId: dto.updatedByUserId,
                active: true,
              },
            });
            if (!updatedByUser) {
              throw Error(USER_ERROR_USER_NOT_FOUND);
            }
          }
          announcements.updatedByUser = updatedByUser;
          announcements.title = dto.title;
          announcements.description = dto.description;
          announcements.targetDateTime = moment(dto.targetDateTime)
            .tz("utc")
            .toDate();
          announcements.isSchedule = dto.isSchedule;
          announcements.status =
            dto.actions === "SEND"
              ? dto.isSchedule
                ? ANNOUNCEMENTS_STATUS.PENDING
                : ANNOUNCEMENTS_STATUS.SENDING
              : announcements.status;

          if (
            dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY &&
            dto.audienceType &&
            dto.audienceType.length > 0
          ) {
            announcements.audienceType = dto.audienceType;

            for (const type of dto.audienceType) {
              if (type === ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL) {
                // await this.validateFilter(
                //   type,
                //   dto.studentPrimaryFilter,
                //   entityManager.connection
                // );
                announcements.studentPrimaryExlcuded =
                  dto.studentPrimaryExlcuded;
              } else if (
                type === ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL
              ) {
                // await this.validateFilter(
                //   type,
                //   dto.studentJuniorFilter,
                //   entityManager.connection
                // );
                announcements.studentJuniorExcluded = dto.studentJuniorExcluded;
              } else if (
                type === ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL
              ) {
                // await this.validateFilter(
                //   type,
                //   dto.studentSeniorFilter,
                //   entityManager.connection
                // );
                announcements.studentSeniorExcluded = dto.studentSeniorExcluded;
              } else {
                // await this.validateFilter(
                //   type as ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE,
                //   dto.employeeFilter,
                //   entityManager.connection
                // );
                announcements.employeeExcluded = dto.employeeExcluded;
              }
            }
          } else if (
            dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_MANY
          ) {
            throw new HttpException(
              "Invalid audienceType",
              HttpStatus.BAD_REQUEST
            );
          }

          if (dto.audienceMode === ANNOUNCEMENT_AUDIENCE_MODE.SEND_TO_ONE) {
            if (
              !dto.targetRecipient ||
              !dto.targetRecipient.type ||
              !dto.targetRecipient.id ||
              dto.targetRecipient.id === ""
            ) {
              throw new HttpException(
                "Invalid target recipient",
                HttpStatus.BAD_REQUEST
              );
            }
            if (dto.targetRecipient.type === TARGET_RECIPIENT_TYPE.EMPLOYEE) {
              // const employee = await entityManager.findOne(Employees, {
              //   where: {
              //     employeeId: dto.targetRecipient.id,
              //     active: true,
              //     school: {
              //       schoolId: announcements?.school?.schoolId,
              //     },
              //   },
              // });
              // if (!employee) {
              //   throw new HttpException(
              //     "Invalid target recipient employee",
              //     HttpStatus.BAD_REQUEST
              //   );
              // }
            }
            if (dto.targetRecipient.type === TARGET_RECIPIENT_TYPE.STUDENT) {
              // const student = await entityManager.findOne(Students, {
              //   where: {
              //     studentId: dto.targetRecipient.id,
              //     active: true,
              //     school: {
              //       schoolId: announcements?.school?.schoolId,
              //     },
              //   },
              // });
              // if (!student) {
              //   throw new HttpException(
              //     "Invalid target recipient student",
              //     HttpStatus.BAD_REQUEST
              //   );
              // }
            }
            announcements.targetRecipient = dto.targetRecipient;
          }

          announcements.audienceType = dto.audienceType;
          announcements.audienceMode = dto.audienceMode;
          announcements.employeeFilter = dto.employeeFilter;
          announcements.studentPrimaryFilter = dto.studentPrimaryFilter;
          announcements.studentJuniorFilter = dto.studentJuniorFilter;
          announcements.studentSeniorFilter = dto.studentSeniorFilter;
          delete announcements.createdByUser;
          delete announcements.school;
          delete announcements.updatedByUser;
          await entityManager.save(Announcements, announcements);

          await this.customCacheManagerService.del(cacheKey);

          if (dto.actions === ANNOUNCEMENT_ACTIONS.SEND) {
            announcements.status = ANNOUNCEMENTS_STATUS.PENDING;
            const utcDate = moment(`${announcements.targetDateTime}`)
              .tz("Asia/Manila")
              .toDate(); // UTC time
            // Create a cron expression based on the scheduled time
            const timezone = "Asia/Manila";
            await this.jobsService.scheduleAnnouncementJob(
              announcements.announcementId,
              utcDate,
              announcements.title,
              timezone
            );
          }
          if (announcements?.createdByUser?.password) {
            delete announcements.createdByUser.password;
          }
          if (announcements?.updatedByUser?.password) {
            delete announcements.updatedByUser.password;
          }
          return announcements;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_announcement")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async cancel(announcementCode) {
    return await this.announcementsRepo.manager.transaction(
      async (entityManager) => {
        const announcements = await entityManager.findOne(Announcements, {
          where: {
            announcementCode,
            active: true,
          },
        });
        if (!announcements) {
          throw Error(ANNOUNCEMENTS_ERROR_NOT_FOUND);
        }
        if (
          announcements.status !== ANNOUNCEMENTS_STATUS.DRAFT ||
          announcements.status !== ANNOUNCEMENTS_STATUS.PENDING.toString()
        ) {
          throw Error(
            `Cannot cancel ${announcements.status.toLowerCase()} Announcement!`
          );
        }
        announcements.status = ANNOUNCEMENTS_STATUS.CANCELLED;
        announcements.updatedDate = moment.tz("utc").toDate();
        return await entityManager.save(Announcements, announcements);
      }
    );
  }

  async delete(announcementCode, schoolCode) {
    return await this.announcementsRepo.manager.transaction(
      async (entityManager) => {
        let announcements: Announcements;
        const cacheKey = `announcements_${announcementCode}`;
        announcements = await this.customCacheManagerService.get<Announcements>(
          cacheKey
        );
        if (!announcements) {
          announcements = await entityManager.findOne(Announcements, {
            where: {
              announcementCode,
              active: true,
            },
          });
          if (!announcements) {
            throw Error(ANNOUNCEMENTS_ERROR_NOT_FOUND);
          }
        }
        if (
          announcements.status !== ANNOUNCEMENTS_STATUS.DRAFT &&
          announcements.status !== ANNOUNCEMENTS_STATUS.PENDING
        ) {
          throw Error(`Cannot edit ${announcements.status} Announcement!`);
        }
        announcements.active = false;
        announcements.updatedDate = moment.tz("utc").toDate();
        await entityManager.save(Announcements, announcements);
        return announcements;
      }
    );
  }

  async validateFilter(
    audienceType: ANNOUNCEMENT_AUDIENCE_TYPE,
    filter:
      | { departmentIds: string[]; employeeTitleIds: string[] }
      | { schoolYearLevelIds: string[]; sectionIds: string[] } = {
      schoolYearLevelIds: [],
      sectionIds: [],
    },
    connection = this.connection
  ) {
    if (
      audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE) &&
      filter["departmentIds"]
    ) {
      if (filter["departmentIds"].length > 0) {
        const departmentIds = await connection.manager.find(Departments, {
          where: {
            departmentId: In(filter["departmentIds"]),
          },
        });

        if (filter["departmentIds"].length > departmentIds.length) {
          throw new HttpException(
            "Some Department from employee filter are invalid",
            HttpStatus.BAD_REQUEST
          );
        }
      }
    }
    if (
      audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE) &&
      filter["employeeTitleIds"]
    ) {
      if (filter["employeeTitleIds"].length > 0) {
        const employeeTitleIds = await connection.manager.find(EmployeeTitles, {
          where: {
            employeeTitleId: In(filter["employeeTitleIds"]),
          },
        });

        if (filter["employeeTitleIds"].length > employeeTitleIds.length) {
          throw new HttpException(
            "Some Employee Title from employee filter are invalid",
            HttpStatus.BAD_REQUEST
          );
        }
      }
    }

    if (
      (audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL) ||
        audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL) ||
        audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL)) &&
      filter["schoolYearLevelIds"]
    ) {
      const schoolYearLevelIds = await connection.manager.find(
        SchoolYearLevels,
        {
          where: {
            schoolYearLevelId: In(filter["schoolYearLevelIds"]),
          },
        }
      );

      if (filter["schoolYearLevelIds"].length > schoolYearLevelIds.length) {
        throw new HttpException(
          `Some School Year Level from ${
            ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL
              ? "Primary school"
              : "" || ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL
              ? "Junior high school"
              : "" || ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL
              ? "Senior high school"
              : ""
          } filter are invalid`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
    if (
      (audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL) ||
        audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL) ||
        audienceType.includes(ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL)) &&
      filter["sectionIds"]
    ) {
      const sectionIds = await connection.manager.find(Sections, {
        where: {
          sectionId: In(filter["sectionIds"]),
        },
      });

      if (filter["sectionIds"].length > sectionIds.length) {
        throw new HttpException(
          `Some Section from ${
            ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL
              ? "Primary school"
              : "" || ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL
              ? "Junior high school"
              : "" || ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL
              ? "Senior high school"
              : ""
          } filter are invalid`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }

  async resend(announcementCode, schoolCode) {
    return await this.announcementsRepo.manager.transaction(
      async (entityManager) => {
        try {
          let announcements: Announcements;
          const cacheKey = `announcements_${announcementCode}`;
          announcements =
            await this.customCacheManagerService.get<Announcements>(cacheKey);

          if (!announcements) {
            announcements = await entityManager.findOne(Announcements, {
              where: {
                announcementCode,
                active: true,
              },
              relations: {
                createdByUser: true,
                updatedByUser: true,
                school: true,
              },
            });
            if (!announcements) {
              throw Error(ANNOUNCEMENTS_ERROR_NOT_FOUND);
            }
          } else {
            await this.customCacheManagerService.del(cacheKey);
          }
          announcements.updatedDate = moment.tz("utc").toDate();
          announcements.status = ANNOUNCEMENTS_STATUS.PENDING;
          delete announcements.createdByUser;
          delete announcements.school;
          delete announcements.updatedByUser;
          await entityManager.save(Announcements, announcements);

          const utcDate = moment(`${announcements.targetDateTime}`)
            .tz("Asia/Manila")
            .toDate(); // UTC time
          // Create a cron expression based on the scheduled time
          const timezone = "Asia/Manila";
          await this.jobsService.scheduleAnnouncementJob(
            announcements.announcementId,
            utcDate,
            announcements.title,
            timezone
          );
          await this.customCacheManagerService.set(
            cacheKey,
            announcements,
            300
          );
          return announcements;
        } catch (ex) {
          throw ex;
        }
      }
    );
  }

  async getAnnouncementRecipients(
    announcementCode: string,
    audienceType: ANNOUNCEMENT_AUDIENCE_TYPE,
    {
      employeeTitleIds,
      employeeDepartmentIds,
      employeeExcludedIds,
      studentPrimarySYLvlIds,
      studentPrimarySectionIds,
      studentPrimaryExcludedIds,
      studentJuniorSYLvlIds,
      studentJuniorSectionIds,
      studentJuniorExcludedIds,
      studentSeniorSYLvlIds,
      studentSeniorSectionIds,
      studentSeniorExcludedIds,
    },
    schoolCode: string
  ) {
    const cacheKey = `announcements_${announcementCode}_recipients_${audienceType}_${
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE
        ? JSON.stringify(employeeTitleIds ?? []) +
          "_" +
          JSON.stringify(employeeDepartmentIds ?? []) +
          "_" +
          JSON.stringify(employeeExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL
        ? JSON.stringify(studentPrimarySYLvlIds ?? []) +
          "_" +
          JSON.stringify(studentPrimarySectionIds ?? []) +
          "_" +
          JSON.stringify(studentPrimaryExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL
        ? JSON.stringify(studentJuniorSYLvlIds ?? []) +
          "_" +
          JSON.stringify(studentJuniorSectionIds ?? []) +
          "_" +
          JSON.stringify(studentJuniorExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL
        ? JSON.stringify(studentSeniorSYLvlIds ?? []) +
          "_" +
          JSON.stringify(studentSeniorSectionIds ?? []) +
          "_" +
          JSON.stringify(studentSeniorExcludedIds ?? [])
        : "")
    }`;
    const cachedData = await this.customCacheManagerService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    let result = [];
    if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE) {
      employeeTitleIds =
        employeeTitleIds && Array.isArray(employeeTitleIds)
          ? employeeTitleIds
          : [];
      employeeDepartmentIds =
        employeeDepartmentIds && Array.isArray(employeeDepartmentIds)
          ? employeeDepartmentIds
          : [];
      employeeExcludedIds =
        employeeExcludedIds && Array.isArray(employeeExcludedIds)
          ? employeeExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Employees, {
          where: [
            {
              active: true,
              employeePosition: {
                employeeTitleId: In(employeeTitleIds),
              },
              employeeId: Not(In(employeeExcludedIds)),
            },
            {
              active: true,
              department: {
                departmentId: In(employeeDepartmentIds),
              },
              employeeId: Not(In(employeeExcludedIds)),
            },
          ],
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.employeeId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL) {
      studentPrimarySYLvlIds =
        studentPrimarySYLvlIds && Array.isArray(studentPrimarySYLvlIds)
          ? studentPrimarySYLvlIds
          : [];
      studentPrimarySectionIds =
        studentPrimarySectionIds && Array.isArray(studentPrimarySectionIds)
          ? studentPrimarySectionIds
          : [];
      studentPrimaryExcludedIds =
        studentPrimaryExcludedIds && Array.isArray(studentPrimaryExcludedIds)
          ? studentPrimaryExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: [
            {
              schoolYearLevel: {
                educationalStage: EDUCATIONAL_STAGE.PRIMARY,
                schoolYearLevelId: In(studentPrimarySYLvlIds),
              },
              active: true,
              studentId: Not(In(studentPrimaryExcludedIds)),
            },
            {
              studentSection: {
                section: {
                  sectionId: In(studentPrimarySectionIds),
                },
              },
              active: true,
              studentId: Not(In(studentPrimaryExcludedIds)),
            },
          ],
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL) {
      studentJuniorSYLvlIds =
        studentJuniorSYLvlIds && Array.isArray(studentJuniorSYLvlIds)
          ? studentJuniorSYLvlIds
          : [];
      studentJuniorSectionIds =
        studentJuniorSectionIds && Array.isArray(studentJuniorSectionIds)
          ? studentJuniorSectionIds
          : [];
      studentJuniorExcludedIds =
        studentJuniorExcludedIds && Array.isArray(studentJuniorExcludedIds)
          ? studentJuniorExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: [
            {
              studentSection: {
                section: {
                  sectionId: In(studentJuniorSectionIds),
                },
              },
              active: true,
              studentId: Not(In(studentJuniorExcludedIds)),
            },
            {
              schoolYearLevel: {
                educationalStage: EDUCATIONAL_STAGE.JUNIOR,
                schoolYearLevelId: In(studentJuniorSYLvlIds),
              },
              active: true,
              studentId: Not(In(studentJuniorExcludedIds)),
            },
          ],
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL) {
      studentSeniorSYLvlIds =
        studentSeniorSYLvlIds && Array.isArray(studentSeniorSYLvlIds)
          ? studentSeniorSYLvlIds
          : [];
      studentSeniorSectionIds =
        studentSeniorSectionIds && Array.isArray(studentSeniorSectionIds)
          ? studentSeniorSectionIds
          : [];
      studentSeniorExcludedIds =
        studentSeniorExcludedIds && Array.isArray(studentSeniorExcludedIds)
          ? studentSeniorExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: [
            {
              studentSection: {
                section: {
                  sectionId: In(studentSeniorSectionIds),
                },
              },
              active: true,
              studentId: Not(In(studentSeniorExcludedIds)),
            },
            {
              schoolYearLevel: {
                educationalStage: EDUCATIONAL_STAGE.SENIOR,
                schoolYearLevelId: In(studentSeniorSYLvlIds),
              },
              active: true,
              studentId: Not(In(studentSeniorExcludedIds)),
            },
          ],
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else {
      result = [];
    }
    await this.customCacheManagerService.set(cacheKey, result, 300);
    return result;
  }

  async getAnnouncementExcluded(
    announcementCode,
    audienceType: ANNOUNCEMENT_AUDIENCE_TYPE,
    {
      employeeExcludedIds,
      studentPrimaryExcludedIds,
      studentJuniorExcludedIds,
      studentSeniorExcludedIds,
    },
    schoolCode: string
  ) {
    const cacheKey = `announcements_${announcementCode}_excluded_${audienceType}_${
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE &&
      employeeExcludedIds
        ? JSON.stringify(employeeExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL &&
      studentPrimaryExcludedIds
        ? JSON.stringify(studentPrimaryExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL &&
      studentJuniorExcludedIds
        ? JSON.stringify(studentJuniorExcludedIds ?? [])
        : "") ||
      (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL &&
      studentSeniorExcludedIds
        ? JSON.stringify(studentSeniorExcludedIds ?? [])
        : "")
    }`;
    const cachedData = await this.customCacheManagerService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    let result = [];
    if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.EMPLOYEE) {
      employeeExcludedIds =
        employeeExcludedIds && Array.isArray(employeeExcludedIds)
          ? employeeExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Employees, {
          where: {
            active: true,
            employeeId: In(employeeExcludedIds),
          },
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.employeeId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.PRIMARY_SCHOOL) {
      studentPrimaryExcludedIds =
        studentPrimaryExcludedIds && Array.isArray(studentPrimaryExcludedIds)
          ? studentPrimaryExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: {
            active: true,
            studentId: In(studentPrimaryExcludedIds),
          },
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.JUNIOR_HIGH_SCHOOL) {
      studentJuniorExcludedIds =
        studentJuniorExcludedIds && Array.isArray(studentJuniorExcludedIds)
          ? studentJuniorExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: {
            active: true,
            studentId: In(studentJuniorExcludedIds),
          },
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else if (audienceType === ANNOUNCEMENT_AUDIENCE_TYPE.SENIOR_HIGH_SCHOOL) {
      studentSeniorExcludedIds =
        studentSeniorExcludedIds && Array.isArray(studentSeniorExcludedIds)
          ? studentSeniorExcludedIds
          : [];
      result = await this.announcementsRepo.manager
        .find(Students, {
          where: {
            active: true,
            studentId: In(studentSeniorExcludedIds),
          },
        })
        .then((res) => {
          return res.map((x) => {
            return {
              id: x.studentId,
              fullName: x.fullName,
            };
          });
        });
    } else {
      result = [];
    }
    await this.customCacheManagerService.set(cacheKey, result, 300);
    return result;
  }
}
