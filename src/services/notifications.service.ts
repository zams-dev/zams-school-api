import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  columnDefToTypeORMCondition,
  normalizeCacheKey,
} from "src/common/utils/utils";
import { Notifications } from "src/db/entities/Notifications";
import { Repository } from "typeorm";
import { CustomCacheManagerService } from "./custom-cache-manager.service";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private readonly notificationsRepo: Repository<Notifications>,
    private customCacheManagerService: CustomCacheManagerService
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const cacheKey = normalizeCacheKey(
      `notifications${
        condition?.forUser?.userId && condition?.forUser?.userId !== ""
          ? "_" + condition?.forUser?.userId
          : ""
      }_paged`,
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
      this.notificationsRepo.find({
        where: condition,
        skip,
        take,
        order,
        relations: {
          forUser: true,
        },
      }),
      this.notificationsRepo.count({
        where: condition,
      }),
    ]);
    const final = {
      results: results.map((x) => {
        delete x.forUser.password;
        if (x?.forUser?.password) {
          delete x.forUser.password;
        }
        return x;
      }),
      total,
    };
    await this.customCacheManagerService.set(cacheKey, final, 300);
    return final;
  }

  async markAsRead(notificationId: string, userId: string) {
    return await this.notificationsRepo.manager.transaction(
      async (entityManager) => {
        const cacheKey = `notifications_${userId}_${notificationId}`;
        let notification =
          await this.customCacheManagerService.get<Notifications>(cacheKey);
        if (!notification) {
          notification = await entityManager.findOne(Notifications, {
            where: {
              notificationId,
            },
          });
        } else {
          await this.customCacheManagerService.del(
            `notifications_${userId}_${notificationId}`
          );
        }

        if (notification) {
          notification.isRead = true;
          await this.customCacheManagerService.set(
            `notifications_${userId}_${notificationId}`,
            notification,
            300
          );
          delete notification.forUser;
          notification = await entityManager.save(Notifications, notification);
          await this.customCacheManagerService.del(
            `notifications_${userId}_paged`
          );
        }
        return notification;
      }
    );
  }

  async getUnreadByUser(userId: string) {
    const cachedData = await this.customCacheManagerService.get<any>(
      `notifications_${userId}_unread`
    );
    if (cachedData) {
      return cachedData; // Return cached result
    }
    const unRead = await this.notificationsRepo.count({
      where: {
        forUser: {
          userId,
          active: true,
        },
        isRead: false,
      },
    });
    await this.customCacheManagerService.set(
      `notifications_${userId}_unread`,
      unRead,
      300
    );
    return unRead;
  }

  // async test({ userId, title, description }) {
  //   this.pusherService.sendNotif([userId], title, description);
  // }
}
