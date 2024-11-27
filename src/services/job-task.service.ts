import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { JOB_STATUS } from "src/common/constant/job.contant";
import { Announcements } from "src/db/entities/Announcements";
import { Jobs } from "src/db/entities/Jobs";
import { Connection, EntityManager, In, Not } from "typeorm";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import {
  ANNOUNCEMENT_AUDIENCE_TYPE,
  ANNOUNCEMENTS_STATUS,
} from "src/common/constant/announcements.constant";
import { Users } from "src/db/entities/Users";
import { type } from "os";
import { NOTIF_TYPE } from "src/common/constant/notifications.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { Notifications } from "src/db/entities/Notifications";
import moment from "moment-timezone";
import { CustomCacheManagerService } from "./custom-cache-manager.service";
@Injectable()
export class JobTaskService {
  private readonly logger = new Logger(JobTaskService.name);
  constructor(
    private connection: Connection,
    private customCacheManagerService: CustomCacheManagerService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async sendAnnouncement(announcementId, connection = this.connection) {
    try {
      const cacheKey = `announcements_announcementId_${announcementId}`;
      let announcement =
        await this.customCacheManagerService.get<Announcements>(cacheKey);
      if (!announcement) {
        announcement = await connection.manager.findOne(Announcements, {
          where: {
            announcementId,
            status: In([
              ANNOUNCEMENTS_STATUS.DRAFT,
              ANNOUNCEMENTS_STATUS.PENDING,
            ]),
          },
          relations: {
            school: true,
          },
        });
        if (!announcement) {
          throw new HttpException(
            "Announcement not found, invalid announcement id",
            HttpStatus.BAD_REQUEST
          );
        }
      } else {
        await this.customCacheManagerService.del(cacheKey);
      }

      let userToNotify: Users[] = [];
      if (announcement.audienceMode === "SEND_TO_MANY") {
        const employeeTitleIds = announcement.employeeFilter["employeeTitleIds"]
          ? announcement.employeeFilter["employeeTitleIds"]
          : [];
        const employeeDepartmentIds = announcement.employeeFilter[
          "departmentIds"
        ]
          ? announcement.employeeFilter["departmentIds"]
          : [];

        const employeeExcludedIds = announcement.employeeExcluded
          ? announcement.employeeExcluded
          : [];
        const cacheKeyEmployeeRecepientUserIds = `announcements_${announcement?.announcementCode}_employee_recepient_userIds`;
        let employeeUserIds = await this.customCacheManagerService.get<any>(
          cacheKeyEmployeeRecepientUserIds
        );
        if (!employeeUserIds || employeeUserIds.length === 0) {
          employeeUserIds = await connection.manager.find(Users, {
            where: [
              {
                employees: {
                  employeePosition: {
                    employeeTitleId: In(employeeTitleIds),
                  },
                  active: true,
                  employeeId: Not(In(employeeExcludedIds)),
                },
                active: true,
              },
              {
                employees: {
                  department: {
                    departmentId: In(employeeDepartmentIds),
                  },
                  active: true,
                  employeeId: Not(In(employeeExcludedIds)),
                },
                active: true,
              },
            ],
          });
        } else {
          await this.customCacheManagerService.del(
            cacheKeyEmployeeRecepientUserIds
          );
        }

        let studentSchoolYearLevelIds = [];
        let studentSectionIds = [];
        let studentExcludedIds = [];

        userToNotify = [...userToNotify, ...employeeUserIds];
        studentSchoolYearLevelIds = [
          ...studentSchoolYearLevelIds,
          ...(announcement.studentPrimaryFilter["schoolYearLevelIds"]
            ? announcement.studentPrimaryFilter["schoolYearLevelIds"]
            : []),
        ];

        studentSectionIds = [
          ...studentSectionIds,
          ...(announcement.studentPrimaryFilter["sectionIds"]
            ? announcement.studentPrimaryFilter["sectionIds"]
            : []),
        ];

        studentExcludedIds = [
          ...(announcement.studentPrimaryExlcuded
            ? announcement.studentPrimaryExlcuded
            : []),
        ];

        studentSchoolYearLevelIds = [
          ...studentSchoolYearLevelIds,
          ...(announcement.studentJuniorFilter["schoolYearLevelIds"]
            ? announcement.studentJuniorFilter["schoolYearLevelIds"]
            : []),
        ];

        studentSectionIds = [
          ...studentSectionIds,
          ...(announcement.studentJuniorFilter["sectionIds"]
            ? announcement.studentJuniorFilter["sectionIds"]
            : []),
        ];

        studentExcludedIds = [
          ...(announcement.studentJuniorExcluded
            ? announcement.studentJuniorExcluded
            : []),
        ];

        studentSchoolYearLevelIds = [
          ...studentSchoolYearLevelIds,
          ...(announcement.studentSeniorFilter["schoolYearLevelIds"]
            ? announcement.studentSeniorFilter["schoolYearLevelIds"]
            : []),
        ];

        studentSectionIds = [
          ...studentSectionIds,
          ...(announcement.studentSeniorFilter["sectionIds"]
            ? announcement.studentSeniorFilter["sectionIds"]
            : []),
        ];

        studentExcludedIds = [
          ...(announcement.studentSeniorExcluded
            ? announcement.studentSeniorExcluded
            : []),
        ];

        const cacheKeyStudentRecepientUserIds = `announcements_${announcement?.announcementCode}_student_recepient_userIds`;
        let studentUserIds = await this.customCacheManagerService.get<any>(
          cacheKeyStudentRecepientUserIds
        );
        if (!studentUserIds || studentUserIds.length === 0) {
          studentUserIds = await connection.manager.find(Users, {
            where: [
              {
                clients: {
                  clientStudents: {
                    student: {
                      schoolYearLevel: {
                        schoolYearLevelId: In(studentSchoolYearLevelIds),
                      },
                      active: true,
                      studentId: Not(In(studentExcludedIds)),
                    },
                  },
                  active: true,
                },
                active: true,
              },
              {
                clients: {
                  clientStudents: {
                    student: {
                      studentSection: {
                        section: {
                          sectionId: In(studentSectionIds),
                        },
                      },
                      active: true,
                      studentId: Not(In(studentExcludedIds)),
                    },
                  },
                  active: true,
                },
                active: true,
              },
            ],
          });
        } else {
          await this.customCacheManagerService.del(
            cacheKeyStudentRecepientUserIds
          );
        }
        userToNotify = [...userToNotify, ...studentUserIds];
      } else if (announcement.audienceMode === "SEND_TO_ALL") {
        const cacheKeyAllRecepientUserIds = `announcements_${announcement?.announcementCode}_all_recepient_userIds`;
        let allRecepientUserIds = await this.customCacheManagerService.get<any>(
          cacheKeyAllRecepientUserIds
        );
        if (!allRecepientUserIds || allRecepientUserIds.length === 0) {
          allRecepientUserIds = await connection.manager.find(Users, {
            where: [
              {
                employees: {
                  school: {
                    schoolCode: announcement?.school?.schoolCode,
                  },
                },
              },
              {
                clients: {
                  clientStudents: {
                    student: {
                      school: {
                        schoolCode: announcement?.school?.schoolCode,
                      },
                    },
                  },
                },
              },
            ],
          });
        } else {
          await this.customCacheManagerService.del(cacheKeyAllRecepientUserIds);
        }
        userToNotify = allRecepientUserIds;
      } else if (
        announcement.audienceMode === "SEND_TO_ONE" &&
        announcement.targetRecipient["id"] &&
        announcement.targetRecipient["type"] &&
        announcement.targetRecipient["type"] === "EMPLOYEE"
      ) {
        const id = announcement.targetRecipient["id"];
        const cacheKeyRecepientUser = `announcements_${announcement?.announcementCode}_employee_send_one_recepient_userId_${id}`;
        let recepientUserIds = await this.customCacheManagerService.get<any>(
          cacheKeyRecepientUser
        );
        if (!recepientUserIds || recepientUserIds.length === 0) {
          recepientUserIds = await connection.manager.find(Users, {
            where: {
              active: true,
              employees: {
                employeeId: id,
                active: true,
              },
            },
          });
        } else {
          await this.customCacheManagerService.del(cacheKeyRecepientUser);
        }
        userToNotify = recepientUserIds;
      } else if (
        announcement.audienceMode === "SEND_TO_ONE" &&
        announcement.targetRecipient["id"] &&
        announcement.targetRecipient["type"] &&
        announcement.targetRecipient["type"] === "STUDENT"
      ) {
        const id = announcement.targetRecipient["id"];
        const cacheKeyRecepientUser = `announcements_${announcement?.announcementCode}_student_send_one_recepient_userId_${id}`;
        let recepientUserIds = await this.customCacheManagerService.get<any>(
          cacheKeyRecepientUser
        );
        if (!recepientUserIds || recepientUserIds.length === 0) {
          recepientUserIds = await connection.manager.find(Users, {
            where: {
              active: true,
              clients: {
                active: true,
                clientStudents: {
                  active: true,
                  student: {
                    active: true,
                    studentId: id,
                  },
                },
              },
            },
          });
        } else {
          await this.customCacheManagerService.del(cacheKeyRecepientUser);
        }
        userToNotify = recepientUserIds;
      }
      this.logger.log(
        `Sending announcement: ${
          announcement.title
        } to user ids: ${userToNotify.map((x) => x.userId)}`
      );

      const notifications = await this.logNotification(
        userToNotify,
        announcement.announcementCode,
        connection.manager,
        announcement.title,
        announcement.description,
        NOTIF_TYPE.ANNOUNCEMENT
      );
      const massRequest = [];
      for (const notification of notifications) {
        massRequest.push(
          this.oneSignalNotificationService.sendToExternalUser(
            notification?.forUser?.userName,
            NOTIF_TYPE.ANNOUNCEMENT,
            announcement.announcementCode,
            [notification.notificationId],
            `Announcement: ${announcement.title}`,
            announcement.description
          )
        );
      }
      const results: { userId: string; success: boolean }[] = await Promise.all(
        massRequest
      );
      console.log("Notify to user results ", JSON.stringify(results));
      for (const user of userToNotify) {
        await this.customCacheManagerService.del(
          `notifications_${user?.userId}_*`
        );
      }

      this.logger.log(`Announcement: ${announcement.title} has been sent.`);
      announcement.status = ANNOUNCEMENTS_STATUS.SENT;
      announcement.dateTimeSent = moment().tz("utc").toDate();
      await this.customCacheManagerService.set(cacheKey, announcement, 300);
      delete announcement?.createdByUser;
      delete announcement?.school;
      delete announcement?.updatedByUser;
      await connection.manager.save(Announcements, announcement);
    } catch (ex) {
      throw ex;
    }
  }

  async logNotification(
    users: Users[],
    referenceId,
    entityManager: EntityManager,
    title: string,
    description: string,
    type: NOTIF_TYPE
  ) {
    let notifcations: Notifications[] = [];
    for (const user of users) {
      notifcations.push({
        dateTime: moment().tz("Asia/Manila").toDate(),
        title: `Announcement: ${title}`,
        description,
        type,
        referenceId,
        isRead: false,
        forUser: user,
        active: true,
      } as any);
    }
    notifcations = await entityManager.save(Notifications, notifcations);
    return await entityManager.find(Notifications, {
      where: {
        notificationId: In(notifcations.map((x) => x.notificationId)),
      },
      relations: {
        forUser: true,
      },
    });
  }
}
