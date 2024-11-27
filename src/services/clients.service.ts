import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { extname } from "path";
import { DEPARTMENTS_ERROR_NOT_FOUND } from "src/common/constant/departments.constant";
import { CLIENTS_ERROR_NOT_FOUND } from "src/common/constant/clients.constant";
import { SCHOOL_YEAR_LEVELS_ERROR_NOT_FOUND } from "src/common/constant/school-year-levels.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  hash,
  generateIndentityCode,
  normalizeCacheKey,
} from "src/common/utils/utils";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { UpdateProfilePictureDto } from "src/core/dto/auth/reset-password.dto copy";
import { UpdateClientUserProfileDto } from "src/core/dto/clients/clients.update.dto";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { Departments } from "src/db/entities/Departments";
import { Files } from "src/db/entities/Files";
import { Clients } from "src/db/entities/Clients";
import { Schools } from "src/db/entities/Schools";
import { Students } from "src/db/entities/Students";
import { UserProfilePic } from "src/db/entities/UserProfilePic";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { v4 as uuid } from "uuid";
import { CustomCacheManagerService } from "./custom-cache-manager.service";
import { UserEmailVerificationLog } from "src/db/entities/UserEmailVerificationLog";

@Injectable()
export class ClientsService {
  constructor(
    private firebaseProvoder: FirebaseProvider,
    @InjectRepository(Clients)
    private readonly clientRepo: Repository<Clients>,
    private customCacheManagerService: CustomCacheManagerService
  ) {}

  async getPagination(
    { pageSize, pageIndex, order, columnDef },
    schoolCode = null
  ) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);
    const condition = columnDefToTypeORMCondition(columnDef);

    const schoolSpecificCondition =
      schoolCode && schoolCode !== ""
        ? {
            clientStudents: {
              student: {
                school: {
                  schoolCode,
                },
              },
            },
          }
        : {};

    const cacheKey = normalizeCacheKey(
      `clients_page${schoolCode && schoolCode !== "" ? "_" + schoolCode : ""}`,
      {
        schoolSpecificCondition,
        skip,
        take,
        order,
      }
    );
    const cachedData = await await this.customCacheManagerService.get<any>(cacheKey);

    if (cachedData) {
      return cachedData; // Return cached result
    }
    const [results, total] = await Promise.all([
      this.clientRepo.find({
        where: {
          ...condition,
          active: true,
          ...schoolSpecificCondition,
        },
        relations: {
          clientStudents: true,
          registeredByUser: true,
          updatedByUser: true,
          user: true,
        },
        skip,
        take,
        order,
      }),
      this.clientRepo.count({
        where: {
          ...condition,
          active: true,
          ...schoolSpecificCondition,
        },
      }),
    ]);
    const final = {
      results: results.map((x) => {
        delete x.user.password;
        delete x.registeredByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
    await await this.customCacheManagerService.set(cacheKey, final, 300);
    return final;
  }

  async getByCode(clientCode) {
    const cacheKey = `clients_${clientCode}`;
    const cachedData = await await this.customCacheManagerService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData; // Return cached result
    }
    const res = await this.clientRepo.findOne({
      where: {
        clientCode,
        active: true,
      },
      relations: {
        clientStudents: {
          student: {
            school: true,
            studentCourse: {
              course: true,
            },
            studentStrand: {
              strand: true,
            },
            schoolYearLevel: true,
          },
        },
        registeredByUser: true,
        updatedByUser: true,
        user: true,
      },
    });

    if (!res) {
      throw Error(USER_ERROR_USER_NOT_FOUND);
    }
    res.clientStudents = res.clientStudents.filter((x) => x.active);
    delete res.user.password;
    delete res.registeredByUser.password;
    if (res?.updatedByUser?.password) {
      delete res.updatedByUser.password;
    }
    await await this.customCacheManagerService.set(cacheKey, res, 300);
    return res;
  }

  async updateProfile(clientCode, dto: UpdateClientUserProfileDto) {
    return await this.clientRepo.manager.transaction(async (entityManager) => {
      let client: Clients;
      const cacheKey = `clients_${clientCode}`;
      client = await await this.customCacheManagerService.get<Clients>(cacheKey);
      if (!client) {
        client = await entityManager.findOne(Clients, {
          where: {
            clientCode,
            active: true,
          },
          relations: {
            clientStudents: {
              student: {
                school: true,
                studentCourse: {
                  course: true,
                },
                studentStrand: {
                  strand: true,
                },
                schoolYearLevel: true,
              },
            },
            registeredByUser: true,
            updatedByUser: true,
            user: true,
          },
        });

        if (!client) {
          throw Error(CLIENTS_ERROR_NOT_FOUND);
        }
      } else {
        await await this.customCacheManagerService.del(cacheKey);
      }

      client.fullName = dto.fullName;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      client.updatedDate = timestamp;
      client.updatedByUser = client.user;
      await await this.customCacheManagerService.set(cacheKey, client, 300);
      delete client.clientStudents;
      await entityManager.save(Clients, client);

      delete client.user.password;
      delete client.registeredByUser.password;
      if (client?.updatedByUser?.password) {
        delete client.updatedByUser.password;
      }
      return client;
    });
  }

  async delete(clientCode) {
    return await this.clientRepo.manager.transaction(async (entityManager) => {
      let client: Clients;
      const cacheKey = `clients_${clientCode}`;
      client = await await this.customCacheManagerService.get<Clients>(cacheKey);
      if (!client) {
        client = await entityManager.findOne(Clients, {
          where: {
            clientCode,
            active: true,
          },
          relations: {
            clientStudents: {
              student: {
                school: true,
                studentCourse: {
                  course: true,
                },
                studentStrand: {
                  strand: true,
                },
                schoolYearLevel: true,
              },
            },
            registeredByUser: true,
            updatedByUser: true,
            user: true,
          },
        });

        if (!client) {
          throw Error(CLIENTS_ERROR_NOT_FOUND);
        }
      } else {
        await await this.customCacheManagerService.del(cacheKey);
      }

      client.active = false;
      await await this.customCacheManagerService.set(cacheKey, client, 300);
      await await this.customCacheManagerService.del("clients_page*");
      delete client?.clientStudents;
      await entityManager.save(Clients, client);
      const userEmailVerificationLogs = await entityManager.find(
        UserEmailVerificationLog,
        {
          where: {
            email: client.email,
          },
        }
      );
      for (const item of userEmailVerificationLogs) {
        item.isUsed = false;
        item.isVerified = false;
        await entityManager.save(UserEmailVerificationLog, item);
      }

      const user = client.user;
      user.active = false;
      await entityManager.save(Users, user);
      delete client.user.password;
      delete client.registeredByUser.password;
      if (client?.updatedByUser?.password) {
        delete client.updatedByUser.password;
      }
      await await this.customCacheManagerService.del("clients_page*");
      await await this.customCacheManagerService.del(`${clientCode}_dashboard_client_*`);
      return client;
    });
  }

  async updateProfilePicture(clientCode, dto: UpdateProfilePictureDto) {
    return await this.clientRepo.manager.transaction(async (entityManager) => {
      let user: Users;
      const cacheKeyUser = `client_user_${clientCode}`;
      user = await await this.customCacheManagerService.get<Users>(cacheKeyUser);
      if (!user) {
        user = await entityManager.findOne(Users, {
          where: {
            clients: {
              clientCode,
            },
          },
          relations: {
            userProfilePic: {
              file: true,
            },
          },
        });

        if (!user) {
          throw new HttpException(`User doesn't exist`, HttpStatus.NOT_FOUND);
        }
      } else {
        await await this.customCacheManagerService.del(cacheKeyUser);
      }
      if (dto.userProfilePic) {
        const newFileName: string = uuid();
        let userProfilePic = await await this.customCacheManagerService.get<UserProfilePic>(
          `client_user_profile_pic_${clientCode}`
        );
        if (!userProfilePic) {
          userProfilePic = await entityManager.findOne(UserProfilePic, {
            where: { userId: user.userId },
            relations: ["file"],
          });
        }
        const bucket = this.firebaseProvoder.app.storage().bucket();
        if (userProfilePic) {
          try {
            const deleteFile = bucket.file(
              `profile/${userProfilePic.file.fileName}`
            );
            deleteFile.delete();
          } catch (ex) {
            console.log(ex);
          }
          const file = userProfilePic.file;
          file.fileName = `${newFileName}${extname(
            dto.userProfilePic.fileName
          )}`;

          const bucketFile = bucket.file(
            `profile/${newFileName}${extname(dto.userProfilePic.fileName)}`
          );
          const img = Buffer.from(dto.userProfilePic.data, "base64");
          await bucketFile.save(img).then(async (res) => {
            console.log("res");
            console.log(res);
            const url = await bucketFile.getSignedUrl({
              action: "read",
              expires: "03-09-2500",
            });

            file.url = url[0];
            userProfilePic.file = await entityManager.save(Files, file);
            user.userProfilePic = await entityManager.save(
              UserProfilePic,
              userProfilePic
            );
          });
        } else {
          userProfilePic = new UserProfilePic();
          userProfilePic.user = user;
          const file = new Files();
          file.fileName = `${newFileName}${extname(
            dto.userProfilePic.fileName
          )}`;
          const bucketFile = bucket.file(
            `profile/${newFileName}${extname(dto.userProfilePic.fileName)}`
          );
          const img = Buffer.from(dto.userProfilePic.data, "base64");
          await bucketFile.save(img).then(async () => {
            const url = await bucketFile.getSignedUrl({
              action: "read",
              expires: "03-09-2500",
            });
            file.url = url[0];
            userProfilePic.file = await entityManager.save(Files, file);
            user.userProfilePic = await entityManager.save(
              UserProfilePic,
              userProfilePic
            );
          });
        }
      }
      let client: Clients;
      const cacheKey = `clients_${clientCode}`;
      client = await await this.customCacheManagerService.get<Clients>(cacheKey);
      if (!client) {
        client = await entityManager.findOne(Clients, {
          where: {
            clientCode,
            active: true,
          },
          relations: {
            clientStudents: {
              student: {
                school: true,
                studentCourse: {
                  course: true,
                },
                studentStrand: {
                  strand: true,
                },
                schoolYearLevel: true,
              },
            },
            registeredByUser: true,
            updatedByUser: true,
            user: true,
          },
        });

        if (!client) {
          throw Error(CLIENTS_ERROR_NOT_FOUND);
        }
      } else {
        await await this.customCacheManagerService.del(cacheKey);
      }
      delete client.user.password;
      delete client.registeredByUser.password;
      if (client?.updatedByUser?.password) {
        delete client.updatedByUser.password;
      }
      return client;
    });
  }
}
