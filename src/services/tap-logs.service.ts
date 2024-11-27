import { CustomCacheManagerService } from "./custom-cache-manager.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagingDevicesResponse } from "firebase-admin/lib/messaging/messaging-api";
import moment from "moment-timezone";
import { LINKSTUDENTREQUEST_ERROR_NOT_FOUND } from "src/common/constant/link-student-request.constant";
import {
  NOTIF_TITLE,
  NOTIF_TYPE,
} from "src/common/constant/notifications.constant";
import { CLIENTS_ERROR_NOT_FOUND } from "src/common/constant/clients.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { STUDENTS_ERROR_NOT_FOUND } from "src/common/constant/students.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { TAPLOGS_ERROR_NOT_FOUND } from "src/common/constant/top-logs.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateTapLogDto } from "src/core/dto/tap-logs/tap-logs.create.dto";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { Notifications } from "src/db/entities/Notifications";
import { ClientStudent } from "src/db/entities/ClientStudent";
import { Clients } from "src/db/entities/Clients";
import { Schools } from "src/db/entities/Schools";
import { Students } from "src/db/entities/Students";
import { TapLogs } from "src/db/entities/TapLogs";
import { UserFirebaseToken } from "src/db/entities/UserFirebaseToken";
import { Users } from "src/db/entities/Users";
import { Repository, EntityManager, In } from "typeorm";
import { PusherService } from "./pusher.service";
import { Machines } from "src/db/entities/Machines";
import { MACHINES_ERROR_NOT_FOUND } from "src/common/constant/machines.constant";
import { FirebaseCloudMessagingService } from "./firebase-cloud-messaging.service";
import { DateConstant } from "src/common/constant/date.constant";
import { UserOneSignalSubscription } from "src/db/entities/UserOneSignalSubscription";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { Employees } from "src/db/entities/Employees";
import { EMPLOYEEUSERACCESS_ERROR_NOT_FOUND } from "src/common/constant/employee-user-access.constant";
import { User } from "@firebase/auth";

@Injectable()
export class TapLogsService {
  constructor(
    @InjectRepository(TapLogs)
    private readonly tapLogsRepo: Repository<TapLogs>,
    private pusherService: PusherService,
    private firebaseProvoder: FirebaseProvider,
    private firebaseCloudMessagingService: FirebaseCloudMessagingService,
    private oneSignalNotificationService: OneSignalNotificationService,
    private customCacheManagerService: CustomCacheManagerService
  ) {}
  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.tapLogsRepo.find({
        where: condition,
        relations: {
          machine: true,
        },
        skip,
        take,
        order,
      }),
      this.tapLogsRepo.count({
        where: condition,
      }),
    ]);
    return {
      results,
      total,
    };
  }

  async getById(tapLogId) {
    const result = await this.tapLogsRepo.findOne({
      where: {
        tapLogId,
      },
      relations: {
        machine: true,
      },
    });
    if (!result) {
      throw Error(TAPLOGS_ERROR_NOT_FOUND);
    } else {
      if (result.type === "STUDENT") {
        return {
          ...result,
          student: await this.tapLogsRepo.manager.findOne(Students, {
            where: { cardNumber: result.cardNumber },
            relations: {
              school: true,
              department: true,
              clientStudents: {
                client: true,
              },
              studentStrand: {
                strand: true,
              },
              studentSection: {
                section: true,
              },
              studentCourse: {
                course: true,
              },
              schoolYearLevel: {
                school: true,
              },
            },
          }),
        };
      } else {
        return {
          ...result,
          employee: this.tapLogsRepo.manager.findOne(Employees, {
            where: {
              cardNumber: result.cardNumber,
              active: true,
            },
            relations: {
              department: true,
              createdByUser: true,
              updatedByUser: true,
              school: true,
              employeePosition: true,
            },
          }),
        };
      }
    }
  }

  async create(dto: CreateTapLogDto) {
    return await this.tapLogsRepo.manager.transaction(async (entityManager) => {
      const date = moment(
        new Date(dto.date),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      const longDate = moment(
        new Date(dto.date),
        DateConstant.DATE_LANGUAGE
      ).format("MMM DD, YYYY");
      const { cardNumber, status, time, sender, orgSchoolCode } = dto;

      const school = await entityManager.findOne(Schools, {
        where: {
          orgSchoolCode,
          active: true,
        },
      });
      if (!school) {
        throw Error(SCHOOLS_ERROR_NOT_FOUND);
      }

      const machine = await entityManager.findOne(Machines, {
        where: {
          school: {
            schoolId: school.schoolId,
          },
          description: sender,
          active: true,
        },
      });
      if (!machine) {
        throw Error(MACHINES_ERROR_NOT_FOUND);
      }
      let tapLog: TapLogs;
      tapLog = await entityManager.findOne(TapLogs, {
        where: {
          date,
          cardNumber,
          machine: {
            machineId: machine.machineId,
          },
          status,
          time: time.toUpperCase(),
        },
      });
      if (!tapLog) {
        tapLog = new TapLogs();
        tapLog.date = date;
        tapLog.cardNumber = cardNumber;
        tapLog.time = dto.time;
        tapLog.status = dto.status;
        tapLog.type = dto.userType;
        tapLog.machine = machine;
        tapLog = await entityManager.save(TapLogs, tapLog);

        const userToNotify: Users[] = [];
        const clientCodesToRefreshCache: string[] = [];
        let title;
        let desc;
        let type;
        if (dto.userType === "STUDENT") {
          const student = await entityManager.findOne(Students, {
            where: { cardNumber },
          });

          if (!student) {
            throw Error(STUDENTS_ERROR_NOT_FOUND);
          }

          const { studentId, fullName } = student;
          title = fullName;
          desc =
            dto.status.toUpperCase() === "LOG IN"
              ? `Your child, ${fullName} has arrived in the school on ${longDate} at ${dto.time}`
              : `Your child, ${fullName} has left the school premises on ${longDate} at ${dto.time}`;
          type = NOTIF_TYPE.STUDENT_LOG.toString();
          const clientStudents = await entityManager.find(ClientStudent, {
            where: {
              student: { studentId },
              active: true,
            },
            relations: {
              client: {
                user: {
                  userFirebaseTokens: true,
                  userOneSignalSubscriptions: true,
                },
              },
            },
          });

          for (const clientStudent of clientStudents) {
            if (
              clientStudent.client &&
              clientStudent.client.user &&
              clientStudent.client.user.userOneSignalSubscriptions
            ) {
              if (
                !userToNotify.some(
                  (x) => x.userId === clientStudent.client.user.userId
                )
              ) {
                userToNotify.push(clientStudent.client.user);
                clientCodesToRefreshCache.push(
                  clientStudent?.client?.clientCode
                );
              }
            }
          }
        } else {
          const employee = await entityManager.findOne(Employees, {
            where: { cardNumber },
            relations: {
              employeeUser: {
                user: true,
              },
            },
          });
          if (!employee) {
            throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
          }
          const { employeeUser, fullName } = employee;
          if (employeeUser && employeeUser?.user && fullName) {
            title = fullName;
            desc =
              dto.status.toUpperCase() === "LOG IN"
                ? `Employee tap activity, ${fullName} has arrived in the school on ${longDate} at ${dto.time}`
                : `Employee tap activity, ${fullName} has left the school premises on ${longDate} at ${dto.time}`;
            type = NOTIF_TYPE.EMPLOYEET_LOG.toString();
            userToNotify.push(employeeUser.user);
          }
        }

        tapLog = await entityManager.findOne(TapLogs, {
          where: {
            tapLogId: tapLog.tapLogId,
          },
          relations: {
            machine: true,
          },
        });

        const notificationIds = await this.logNotification(
          userToNotify,
          tapLog.tapLogId,
          entityManager,
          title,
          desc
        );
        const massRequest = [];
        for (const user of userToNotify) {
          massRequest.push(
            this.oneSignalNotificationService.sendToExternalUser(
              user.userName,
              type,
              tapLog.tapLogId,
              notificationIds,
              title,
              desc
            )
          );
        }
        const results: { userId: string; success: boolean }[] =
          await Promise.all(massRequest);
        console.log("Notify to user results ", JSON.stringify(results));
        for (const clientCode of clientCodesToRefreshCache) {
          await this.customCacheManagerService.del(
            `${clientCode}_dashboard_client_students_*`
          );
          await this.customCacheManagerService.del(
            `${clientCode}_notification_*`
          );
        }
        for (const user of userToNotify) {
          await this.customCacheManagerService.del(
            `notifications_${user?.userId}_*`
          );
        }
      }
      return tapLog;
    });
  }

  async createBatch(dtos: CreateTapLogDto[]) {
    try {
      return await this.tapLogsRepo.manager.transaction(
        async (entityManager) => {
          const success = [];
          const warning = [];
          const failed = [];
          for (const dto of dtos) {
            try {
              const date = moment(
                new Date(dto.date),
                DateConstant.DATE_LANGUAGE
              ).format("YYYY-MM-DD");
              const longDate = moment(
                new Date(dto.date),
                DateConstant.DATE_LANGUAGE
              ).format("MMM DD, YYYY");
              const { cardNumber, status, time, sender, orgSchoolCode } = dto;

              const school = await entityManager.findOne(Schools, {
                where: {
                  orgSchoolCode,
                  active: true,
                },
              });
              if (!school) {
                throw Error(SCHOOLS_ERROR_NOT_FOUND);
              }

              // let machine = await entityManager.findOne(Machines, {
              //   where: {
              //     description: sender,
              //     active: true,
              //   },
              // });
              const machine = (await entityManager
                .createQueryBuilder("Machines", "m")
                .leftJoinAndSelect("m.school", "s")
                .where(
                  "trim(upper(m.description)) = trim(upper(:sender)) AND " +
                    "s.orgSchoolCode = :orgSchoolCode and m.active = true"
                )
                .setParameters({
                  sender,
                  orgSchoolCode,
                })
                .getOne()) as Machines;
              if (!machine) {
                throw Error(MACHINES_ERROR_NOT_FOUND);
              }
              let tapLog: TapLogs;
              tapLog = await entityManager.findOne(TapLogs, {
                where: {
                  date,
                  cardNumber,
                  status,
                  time: time.toUpperCase(),
                },
              });
              if (!tapLog) {
                tapLog = new TapLogs();
                tapLog.date = date;
                tapLog.cardNumber = cardNumber;
                tapLog.time = dto.time;
                tapLog.status = dto.status;
                tapLog.type = dto.userType;
                tapLog.machine = machine;
                tapLog = await entityManager.save(TapLogs, tapLog);

                const userToNotify: Users[] = [];
                const clientCodesToRefreshCache: string[] = [];
                let title;
                let desc;
                let type;
                if (dto.userType === "STUDENT") {
                  const student = await entityManager.findOne(Students, {
                    where: { cardNumber },
                  });

                  if (!student) {
                    throw Error(STUDENTS_ERROR_NOT_FOUND);
                  }

                  const { studentId, fullName } = student;
                  title = fullName;
                  desc =
                    dto.status.toUpperCase() === "LOG IN"
                      ? `Your child, ${fullName} has arrived in the school on ${longDate} at ${dto.time}`
                      : `Your child, ${fullName} has left the school premises on ${longDate} at ${dto.time}`;
                  type = NOTIF_TYPE.STUDENT_LOG.toString();
                  const clientStudents = await entityManager.find(
                    ClientStudent,
                    {
                      where: {
                        student: { studentId },
                      },
                      relations: {
                        client: {
                          user: {
                            userFirebaseTokens: true,
                            userOneSignalSubscriptions: true,
                          },
                        },
                      },
                    }
                  );

                  for (const clientStudent of clientStudents) {
                    if (
                      clientStudent.client &&
                      clientStudent.client.user &&
                      clientStudent.client.user.userOneSignalSubscriptions
                    ) {
                      if (
                        !userToNotify.some(
                          (x) => x.userId === clientStudent.client.user.userId
                        )
                      ) {
                        userToNotify.push(clientStudent.client.user);
                        clientCodesToRefreshCache.push(
                          clientStudent?.client?.clientCode
                        );
                      }
                    }
                  }
                } else {
                  const employee = await entityManager.findOne(Employees, {
                    where: { cardNumber },
                    relations: {
                      employeeUser: {
                        user: true,
                      },
                    },
                  });
                  if (!employee) {
                    throw Error(EMPLOYEEUSERACCESS_ERROR_NOT_FOUND);
                  }
                  const { employeeUser, fullName } = employee;
                  title = fullName;
                  desc =
                    dto.status.toUpperCase() === "LOG IN"
                      ? `Employee tap activity, ${fullName} has arrived in the school on ${longDate} at ${dto.time}`
                      : `Employee tap activity, ${fullName} has left the school premises on ${longDate} at ${dto.time}`;
                  type = NOTIF_TYPE.EMPLOYEET_LOG.toString();
                  userToNotify.push(employeeUser.user);
                }

                tapLog = await entityManager.findOne(TapLogs, {
                  where: {
                    tapLogId: tapLog.tapLogId,
                  },
                  relations: {
                    machine: true,
                  },
                });

                const notificationIds = await this.logNotification(
                  userToNotify,
                  tapLog.tapLogId,
                  entityManager,
                  title,
                  desc
                );
                const massRequest = [];
                for (const user of userToNotify) {
                  massRequest.push(
                    this.oneSignalNotificationService.sendToExternalUser(
                      user.userName,
                      type,
                      tapLog.tapLogId,
                      notificationIds,
                      title,
                      desc
                    )
                  );
                }
                const results: { userId: string; success: boolean }[] =
                  await Promise.all(massRequest);
                console.log("Notify to user results ", JSON.stringify(results));
                for (const clientCode of clientCodesToRefreshCache) {
                  await this.customCacheManagerService.del(
                    `${clientCode}_dashboard_client_students_*`
                  );
                  await this.customCacheManagerService.del(
                    `${clientCode}_notification_*`
                  );
                }
                for (const user of userToNotify) {
                  await this.customCacheManagerService.del(
                    `notifications_${user?.userId}_*`
                  );
                }
              }
              success.push({
                cardNumber: dto.cardNumber,
                refId: dto.refId,
              });
            } catch (ex) {
              failed.push({
                cardNumber: dto.cardNumber,
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

  async logNotification(
    users: Users[],
    referenceId,
    entityManager: EntityManager,
    title: string,
    description: string
  ) {
    const notifcations = [];

    const timestamp = await entityManager
      .query(CONST_QUERYCURRENT_TIMESTAMP)
      .then((res) => {
        return res[0]["timestamp"];
      });
    users.forEach((x) => {
      notifcations.push({
        dateTime: timestamp,
        title,
        description,
        type: NOTIF_TYPE.STUDENT_LOG.toString(),
        referenceId,
        isRead: false,
        forUser: x,
      });
    });
    const res: any[] = await entityManager.save(Notifications, notifcations);
    const notificationsIds = res.map((x) => x.notificationId);
    await this.pusherService.sendNotif(
      users.map((x) => x.userId),
      notificationsIds,
      referenceId,
      NOTIF_TYPE.STUDENT_LOG.toString() as any,
      title,
      description
    );
    return notificationsIds;
  }
}
