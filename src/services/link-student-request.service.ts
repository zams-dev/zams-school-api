import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LINKSTUDENTREQUEST_ERROR_NOT_FOUND } from "src/common/constant/link-student-request.constant";
import {
  NOTIF_TITLE,
  NOTIF_TYPE,
} from "src/common/constant/notifications.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  normalizeCacheKey,
} from "src/common/utils/utils";
import { CreateLinkStudentRequestDto } from "src/core/dto/link-student-request/link-student-request.create.dto";
import {
  UnLinkedStudentDto,
  UpdateLinkStudentRequestDto,
  UpdateLinkStudentRequestStatusDto,
  VerifyStudentRequestDto,
} from "src/core/dto/link-student-request/link-student-request.update.dto";
import { LinkStudentRequest } from "src/db/entities/LinkStudentRequest";
import { Notifications } from "src/db/entities/Notifications";
import { Schools } from "src/db/entities/Schools";
import { Students } from "src/db/entities/Students";
import { Users } from "src/db/entities/Users";
import { EntityManager, ILike, Repository } from "typeorm";
import { Clients } from "src/db/entities/Clients";
import { ClientStudent } from "src/db/entities/ClientStudent";
import { CLIENTS_ERROR_NOT_FOUND } from "src/common/constant/clients.constant";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { MessagingDevicesResponse } from "firebase-admin/lib/messaging/messaging-api";
import { UserFirebaseToken } from "src/db/entities/UserFirebaseToken";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { UserOneSignalSubscription } from "src/db/entities/UserOneSignalSubscription";
import { STUDENTS_ERROR_NOT_FOUND } from "src/common/constant/students.constant";
import moment from "moment-timezone";
import { CustomCacheManagerService } from "./custom-cache-manager.service";

@Injectable()
export class LinkStudentRequestService {
  constructor(
    @InjectRepository(LinkStudentRequest)
    private readonly linkStudentRequestRepo: Repository<LinkStudentRequest>,
    private firebaseProvoder: FirebaseProvider,
    private oneSignalNotificationService: OneSignalNotificationService,
    private customCacheManagerService: CustomCacheManagerService
  ) {}
  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    let cacheKey;
    if (
      condition?.requestedByClient &&
      condition?.requestedByClient?.clientCode &&
      condition?.requestedByClient?.clientCode !== ""
    ) {
      cacheKey = normalizeCacheKey(
        `link_student_request_paged_${condition?.requestedByClient?.clientCode}`,
        {
          condition,
          skip,
          take,
          order,
        }
      );
    } else {
      cacheKey = normalizeCacheKey(
        `link_student_request_school_paged_${
          condition?.school &&
          condition?.school?.schoolCode &&
          condition?.school?.schoolCode !== ""
            ? condition?.school?.schoolCode
            : ""
        }`,
        {
          condition,
          skip,
          take,
          order,
        }
      );
    }
    const cachedData = await this.customCacheManagerService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData; // Return cached result
    }
    const [results, total] = await Promise.all([
      this.linkStudentRequestRepo.find({
        where: condition,
        relations: {
          student: {
            schoolYearLevel: true,
            studentSection: {
              section: true,
            },
            studentCourse: {
              course: true,
            },
          },
          school: true,
          requestedByClient: {
            user: true,
          },
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.linkStudentRequestRepo.count({
        where: condition,
      }),
    ]);
    const final = {
      results: results.map((x) => {
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

  async getByCode(linkStudentRequestCode) {
    const cacheKey = `link_student_request_${linkStudentRequestCode}`;
    const cachedData = await this.customCacheManagerService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData; // Return cached result
    }
    const result = await this.linkStudentRequestRepo.findOne({
      where: {
        linkStudentRequestCode,
      },
      relations: {
        student: {
          schoolYearLevel: true,
          studentSection: {
            section: true,
          },
          studentCourse: {
            course: true,
          },
        },
        school: true,
        requestedByClient: {
          user: true,
        },
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(LINKSTUDENTREQUEST_ERROR_NOT_FOUND);
    }
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    await this.customCacheManagerService.set(cacheKey, result, 300);
    return result;
  }

  async create(dto: CreateLinkStudentRequestDto) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        let linkStudentRequest = new LinkStudentRequest();
        if (dto.studentSearchOption && dto.studentSearchOption === "ID") {
          const cacheKey = `link_student_request_pending_using_id_
          ${dto.requestedByClientCode}_
          ${dto.orgSchoolCode}_
          ${dto.orgStudentId}`;
          linkStudentRequest = await this.customCacheManagerService.get<any>(cacheKey);
          if (!linkStudentRequest) {
            linkStudentRequest = await entityManager.findOne(
              LinkStudentRequest,
              {
                where: {
                  requestedByClient: {
                    clientCode: dto.requestedByClientCode,
                  },
                  studentSearchOption: dto.studentSearchOption,
                  student: {
                    orgStudentId: dto.orgStudentId,
                  },
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  status: "PENDING",
                },
                relations: {
                  student: {
                    schoolYearLevel: true,
                    studentSection: {
                      section: true,
                    },
                    studentCourse: {
                      course: true,
                    },
                  },
                  school: true,
                  requestedByClient: {
                    user: true,
                  },
                  updatedByUser: true,
                },
              }
            );
          }
          if (linkStudentRequest) {
            throw Error(
              "A request to link " +
                linkStudentRequest.student.fullName +
                " was already created by " +
                linkStudentRequest.requestedByClient.fullName
            );
          }
        } else if (
          dto.studentSearchOption &&
          dto.studentSearchOption === "NAME"
        ) {
          const cacheKey = `link_student_request_pending_using_name_
          ${dto.requestedByClientCode}_
          ${dto.orgSchoolCode}_
          ${dto.requestStudentName}`;
          linkStudentRequest = await this.customCacheManagerService.get<any>(cacheKey);
          if (!linkStudentRequest) {
            linkStudentRequest = await entityManager.findOne(
              LinkStudentRequest,
              {
                where: {
                  requestedByClient: {
                    clientCode: dto.requestedByClientCode,
                  },
                  studentSearchOption: dto.studentSearchOption,
                  requestStudentName: ILike(`%${dto.requestStudentName}%`),
                  school: {
                    orgSchoolCode: dto.orgSchoolCode,
                  },
                  status: "PENDING",
                },
                relations: {
                  student: {
                    schoolYearLevel: true,
                    studentSection: {
                      section: true,
                    },
                    studentCourse: {
                      course: true,
                    },
                  },
                  school: true,
                  requestedByClient: {
                    user: true,
                  },
                  updatedByUser: true,
                },
              }
            );
          }
          if (linkStudentRequest) {
            throw Error(
              "A request to link " +
                dto.requestStudentName +
                " was already created by " +
                linkStudentRequest.requestedByClient.fullName
            );
          }
        }
        linkStudentRequest = new LinkStudentRequest();
        linkStudentRequest.studentSearchOption = dto.studentSearchOption
          ? dto.studentSearchOption
          : ("ID" as any);
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        linkStudentRequest.dateRequested = timestamp;

        const cacheKeyRequestedByClient = `clients_${dto.requestedByClientCode}`;
        let requestedByClient = await this.customCacheManagerService.get<Clients>(
          cacheKeyRequestedByClient
        );
        if (!requestedByClient) {
          requestedByClient = await entityManager.findOne(Clients, {
            where: {
              clientCode: dto.requestedByClientCode,
              active: true,
            },
          });
        }
        if (!requestedByClient) {
          throw Error(CLIENTS_ERROR_NOT_FOUND);
        }
        delete requestedByClient.clientStudents;
        delete requestedByClient.registeredByUser;
        delete requestedByClient.updatedByUser;
        delete requestedByClient.user;
        linkStudentRequest.requestedByClient = requestedByClient;

        const cacheKeyOrgSchoolCode = `schools_${dto.orgSchoolCode}`;
        let school = await this.customCacheManagerService.get<Schools>(cacheKeyOrgSchoolCode);
        if (!school) {
          school = await entityManager.findOne(Schools, {
            where: {
              orgSchoolCode: dto.orgSchoolCode,
              active: true,
            },
          });
        }
        if (!school) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }
        linkStudentRequest.school = school;
        if (linkStudentRequest.studentSearchOption === "ID") {
          if (!dto.orgStudentId || dto.orgStudentId === "") {
            throw Error("Student Id is required");
          }

          const clientStudent = await entityManager.findOne(ClientStudent, {
            where: {
              client: {
                clientCode: dto.requestedByClientCode,
                active: true,
              },
              student: {
                orgStudentId: dto.orgStudentId,
                active: true,
              },
              active: true,
            },
            relations: {
              client: true,
              student: true,
            },
          });
          if (clientStudent) {
            throw Error(
              "Student " +
                clientStudent.student.fullName +
                " was already linked to client " +
                clientStudent.client.fullName
            );
          }

          let student = await this.customCacheManagerService.get<Students>(
            `students_org_id_${dto.orgStudentId}`
          );
          if (!student) {
            student = await entityManager.findOne(Students, {
              where: {
                orgStudentId: dto.orgStudentId,
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
          }
          if (!student) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          linkStudentRequest.student = student;
          linkStudentRequest.requestStudentName = `${student?.firstName} ${student?.lastName}`;
        } else {
          if (!dto.requestStudentName || dto.requestStudentName === "") {
            throw Error("Student name is required");
          }
          linkStudentRequest.requestStudentName = dto.requestStudentName;
        }
        linkStudentRequest.requestMessage = dto.requestMessage;

        linkStudentRequest = await entityManager.save(linkStudentRequest);
        linkStudentRequest.linkStudentRequestCode = generateIndentityCode(
          linkStudentRequest.linkStudentRequestId
        );
        linkStudentRequest = await entityManager.save(
          LinkStudentRequest,
          linkStudentRequest
        );
        await this.customCacheManagerService.del(`link_student_request_school_paged*`);
        await this.customCacheManagerService.del(
          `link_student_request_paged_${linkStudentRequest?.requestedByClient?.clientCode}*`
        );
        return linkStudentRequest;
      }
    );
  }
  async approve(
    linkStudentRequestCode,
    dto: UpdateLinkStudentRequestStatusDto
  ) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        const cacheKey = `link_student_request_${linkStudentRequestCode}`;
        let linkStudentRequest =
          await this.customCacheManagerService.get<LinkStudentRequest>(cacheKey);
        if (!linkStudentRequest) {
          linkStudentRequest = await entityManager.findOne(LinkStudentRequest, {
            where: {
              linkStudentRequestCode,
            },
            relations: {
              student: {
                schoolYearLevel: true,
                studentSection: {
                  section: true,
                },
                studentCourse: {
                  course: true,
                },
              },
              school: true,
              requestedByClient: {
                user: true,
              },
              updatedByUser: true,
            },
          });
          if (!linkStudentRequest) {
            throw Error(LINKSTUDENTREQUEST_ERROR_NOT_FOUND);
          }
        }
        if (
          linkStudentRequest.status === "APPROVED" ||
          linkStudentRequest.status === "CANCELLED" ||
          linkStudentRequest.status === "REJECTED"
        ) {
          throw Error(
            "Not allowed to update status, request was already - " +
              linkStudentRequest.status.toLowerCase()
          );
        }
        linkStudentRequest.status = "APPROVED";
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        linkStudentRequest.updatedDate = timestamp;
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
        linkStudentRequest.updatedByUser = updatedByUser;

        let clientStudent = await entityManager.findOne(ClientStudent, {
          where: {
            client: {
              clientId: linkStudentRequest.requestedByClient.clientId,
            },
            student: {
              studentId: linkStudentRequest.student.studentId,
            },
            active: true,
          },
          relations: {
            client: true,
            student: true,
          },
        });
        if (!clientStudent) {
          clientStudent = new ClientStudent();
          clientStudent.client = await entityManager.findOne(Clients, {
            where: {
              clientId: linkStudentRequest.requestedByClient.clientId,
            },
          });
          clientStudent.student = linkStudentRequest.student;
        }
        clientStudent.active = true;
        await entityManager.save(ClientStudent, clientStudent);
        await entityManager.save(LinkStudentRequest, linkStudentRequest);
        const notifTitle = NOTIF_TITLE.LINK_REQUEST_APPROVED;
        const notifDesc =
          "Request to Link Student " +
          linkStudentRequest.student?.fullName +
          " was approved!";
        const notificationIds = await this.logNotification(
          linkStudentRequest.requestedByClient.user,
          linkStudentRequest.linkStudentRequestCode,
          entityManager,
          notifTitle,
          notifDesc
        );
        const pushResult =
          await this.oneSignalNotificationService.sendToExternalUser(
            linkStudentRequest?.requestedByClient?.user?.userName,
            NOTIF_TYPE.LINK_REQUEST.toString() as any,
            linkStudentRequest.linkStudentRequestCode,
            notificationIds,
            notifTitle,
            notifDesc
          );
        console.log(pushResult);
        await this.customCacheManagerService.del(
          `notifications_${linkStudentRequest.requestedByClient.user?.userId}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_id_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_name_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_${linkStudentRequestCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_school_paged*`);
        await this.customCacheManagerService.del(
          `link_student_request_paged_${linkStudentRequest?.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_${linkStudentRequestCode}`);
        await this.customCacheManagerService.set(
          `link_student_request_${linkStudentRequestCode}`,
          linkStudentRequest,
          300
        );
        delete linkStudentRequest.requestedByClient.user.password;
        delete linkStudentRequest.updatedByUser.password;
        return linkStudentRequest;
      }
    );
  }
  async reject(linkStudentRequestCode, dto: UpdateLinkStudentRequestStatusDto) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        const cacheKey = `link_student_request_${linkStudentRequestCode}`;
        let linkStudentRequest =
          await this.customCacheManagerService.get<LinkStudentRequest>(cacheKey);
        if (!linkStudentRequest) {
          linkStudentRequest = await entityManager.findOne(LinkStudentRequest, {
            where: {
              linkStudentRequestCode,
            },
            relations: {
              student: {
                schoolYearLevel: true,
                studentSection: {
                  section: true,
                },
                studentCourse: {
                  course: true,
                },
              },
              school: true,
              requestedByClient: {
                user: true,
              },
              updatedByUser: true,
            },
          });
          if (!linkStudentRequest) {
            throw Error(LINKSTUDENTREQUEST_ERROR_NOT_FOUND);
          }
        }
        if (
          linkStudentRequest.status === "APPROVED" ||
          linkStudentRequest.status === "CANCELLED" ||
          linkStudentRequest.status === "REJECTED"
        ) {
          throw Error(
            "Not allowed to update status, request was already - " +
              linkStudentRequest.status.toLowerCase()
          );
        }
        linkStudentRequest.status = "REJECTED";
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        linkStudentRequest.updatedDate = timestamp;

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
        linkStudentRequest.updatedByUser = updatedByUser;
        await entityManager.save(LinkStudentRequest, linkStudentRequest);
        const notifTitle = NOTIF_TITLE.LINK_REQUEST_REJECTED;
        const notifDesc =
          "Request to Link Student " +
          linkStudentRequest.student?.fullName +
          " was rejected!";
        const notificationIds = await this.logNotification(
          linkStudentRequest.requestedByClient.user,
          linkStudentRequest.linkStudentRequestCode,
          entityManager,
          notifTitle,
          notifDesc
        );
        const pushResult =
          await this.oneSignalNotificationService.sendToExternalUser(
            linkStudentRequest?.requestedByClient?.user?.userName,
            NOTIF_TYPE.LINK_REQUEST.toString() as any,
            linkStudentRequest.linkStudentRequestCode,
            notificationIds,
            notifTitle,
            notifDesc
          );
        console.log(pushResult);
        await this.customCacheManagerService.del(
          `notifications_${linkStudentRequest.requestedByClient.user?.userId}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_id_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_name_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_${linkStudentRequestCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_school_paged*`);
        await this.customCacheManagerService.del(
          `link_student_request_paged_${linkStudentRequest?.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_${linkStudentRequestCode}`);
        await this.customCacheManagerService.set(
          `link_student_request_${linkStudentRequestCode}`,
          linkStudentRequest,
          300
        );
        delete linkStudentRequest.requestedByClient.user.password;
        delete linkStudentRequest.updatedByUser.password;
        return linkStudentRequest;
      }
    );
  }
  async cancel(linkStudentRequestCode, dto: UpdateLinkStudentRequestStatusDto) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        const cacheKey = `link_student_request_${linkStudentRequestCode}`;
        let linkStudentRequest =
          await this.customCacheManagerService.get<LinkStudentRequest>(cacheKey);
        if (!linkStudentRequest) {
          linkStudentRequest = await entityManager.findOne(LinkStudentRequest, {
            where: {
              linkStudentRequestCode,
            },
            relations: {
              student: {
                schoolYearLevel: true,
                studentSection: {
                  section: true,
                },
                studentCourse: {
                  course: true,
                },
              },
              school: true,
              requestedByClient: {
                user: true,
              },
              updatedByUser: true,
            },
          });
          if (!linkStudentRequest) {
            throw Error(LINKSTUDENTREQUEST_ERROR_NOT_FOUND);
          }
        }
        if (
          linkStudentRequest.status === "APPROVED" ||
          linkStudentRequest.status === "CANCELLED" ||
          linkStudentRequest.status === "REJECTED"
        ) {
          throw Error(
            "Not allowed to update status, request was already - " +
              linkStudentRequest.status.toLowerCase()
          );
        }
        linkStudentRequest.status = "CANCELLED";
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        linkStudentRequest.updatedDate = timestamp;

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
        linkStudentRequest.updatedByUser = updatedByUser;
        await entityManager.save(LinkStudentRequest, linkStudentRequest);
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_id_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_pending_using_name_${linkStudentRequest.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(
          `link_student_request_${linkStudentRequestCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_school_paged*`);
        await this.customCacheManagerService.del(
          `link_student_request_paged_${linkStudentRequest?.requestedByClient?.clientCode}*`
        );
        await this.customCacheManagerService.del(`link_student_request_${linkStudentRequestCode}`);
        await this.customCacheManagerService.set(
          `link_student_request_${linkStudentRequestCode}`,
          linkStudentRequest,
          300
        );
        delete linkStudentRequest.updatedByUser.password;
        return linkStudentRequest;
      }
    );
  }
  async verify(linkStudentRequestCode, dto: VerifyStudentRequestDto) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        const cacheKey = `link_student_request_${linkStudentRequestCode}`;
        let linkStudentRequest =
          await this.customCacheManagerService.get<LinkStudentRequest>(cacheKey);
        if (!linkStudentRequest) {
          linkStudentRequest = await entityManager.findOne(LinkStudentRequest, {
            where: {
              linkStudentRequestCode,
            },
            relations: {
              student: {
                schoolYearLevel: true,
                studentSection: {
                  section: true,
                },
                studentCourse: {
                  course: true,
                },
              },
              school: true,
              requestedByClient: {
                user: true,
              },
              updatedByUser: true,
            },
          });
          if (!linkStudentRequest) {
            throw Error(LINKSTUDENTREQUEST_ERROR_NOT_FOUND);
          }
        }
        if (
          linkStudentRequest.status === "APPROVED" ||
          linkStudentRequest.status === "CANCELLED" ||
          linkStudentRequest.status === "REJECTED"
        ) {
          throw Error(
            "Not allowed to update status, request was already - " +
              linkStudentRequest.status.toLowerCase()
          );
        }
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        linkStudentRequest.updatedDate = timestamp;

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
        linkStudentRequest.updatedByUser = updatedByUser;

        if (!dto.studentCode || dto.studentCode === "") {
          throw Error("Student Id is required");
        }
        const clientStudent = await entityManager.findOne(ClientStudent, {
          where: {
            client: {
              clientCode: linkStudentRequest?.requestedByClient?.clientCode,
              active: true,
            },
            student: {
              studentCode: dto.studentCode,
              active: true,
            },
            active: true,
          },
          relations: {
            client: true,
            student: true,
          },
        });
        if (clientStudent) {
          throw Error(
            "Student " +
              clientStudent.student.fullName +
              " was already linked to client " +
              clientStudent.client.fullName
          );
        }

        let student = await this.customCacheManagerService.get<Students>(
          `students_${dto.studentCode}`
        );
        if (!student) {
          student = await entityManager.findOne(Students, {
            where: {
              studentCode: dto.studentCode,
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
        }
        if (!student) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }
        linkStudentRequest.student = student;
        linkStudentRequest.requestStudentName = student?.fullName;

        await entityManager.save(LinkStudentRequest, linkStudentRequest);
        await this.customCacheManagerService.del(`link_student_request_${linkStudentRequestCode}`);
        await this.customCacheManagerService.set(
          `link_student_request_${linkStudentRequestCode}`,
          linkStudentRequest,
          300
        );
        delete linkStudentRequest.updatedByUser.password;
        return linkStudentRequest;
      }
    );
  }

  async unlinkStudent(dto: UnLinkedStudentDto) {
    return await this.linkStudentRequestRepo.manager.transaction(
      async (entityManager) => {
        let student = await this.customCacheManagerService.get<Students>(
          `students_${dto.studentCode}`
        );
        if (!student) {
          student = await entityManager.findOne(Students, {
            where: {
              studentCode: dto.studentCode,
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
        }
        if (!student) {
          throw Error(SCHOOLS_ERROR_NOT_FOUND);
        }

        const cacheKey = `clients_${dto?.clientCode}`;
        let client = await this.customCacheManagerService.get<any>(cacheKey);
        if (!client) {
          client = await entityManager.findOne(Clients, {
            where: {
              clientCode: dto.clientCode,
              active: true,
            },
            relations: {},
          });

          if (!client) {
            throw Error(CLIENTS_ERROR_NOT_FOUND);
          }
        }

        let clientStudent = await entityManager.findOne(ClientStudent, {
          where: {
            student: {
              studentCode: dto.studentCode,
            },
            client: {
              clientCode: dto.clientCode,
            },
            active: true,
          },
          relations: {},
        });

        if (!clientStudent) {
          throw Error(`Student was already unlinked to ${client.fullName}`);
        }

        clientStudent.active = false;
        clientStudent.dateRemoved = new Date(
          moment.utc().format("YYYY-MM-DD HH:mm:ss")
        );
        clientStudent = await entityManager.save(ClientStudent, clientStudent);

        student.accessGranted = true;
        delete student?.clientStudents;
        await entityManager.save(Students, student);
        delete student.registeredByUser.password;
        if (student?.updatedByUser?.password) {
          delete student.updatedByUser.password;
        }
        await this.customCacheManagerService.del(`${dto?.clientCode}_dashboard_client_*`);
        return student;
      }
    );
  }

  async logNotification(
    user: Users,
    referenceId,
    entityManager: EntityManager,
    title: string,
    description: string
  ) {
    const notifcation = {
      title,
      description,
      type: NOTIF_TYPE.LINK_REQUEST.toString(),
      referenceId,
      isRead: false,
      forUser: user,
    };
    const res: any = await entityManager.save(Notifications, notifcation);
    const notifcationIds = [res.notificationId];
    return notifcationIds;
  }
}
