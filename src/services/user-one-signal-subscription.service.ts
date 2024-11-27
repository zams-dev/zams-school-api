import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_ONE_SIGNAL_SUBSCRIPTION_ERROR_USER_NOT_FOUND } from "src/common/constant/user-one-signal-subscription.constant";
import { CreateUserOneSignalSubscriptionDto } from "src/core/dto/user-one-signal-subscription/user-one-signal-subscription.create.dto";
import { UserOneSignalSubscription } from "src/db/entities/UserOneSignalSubscription";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { PusherService } from "./pusher.service";
import { OneSignalNotificationService } from "./one-signal-notification.service";

@Injectable()
export class UserOneSignalSubscriptionService {
  constructor(
    @InjectRepository(UserOneSignalSubscription)
    private readonly ueserFirebaseTokensRepo: Repository<UserOneSignalSubscription>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async getBySubscriptionId(subscriptionId) {
    const result = await this.ueserFirebaseTokensRepo.findOne({
      where: {
        subscriptionId,
      },
      relations: {
        user: true,
      },
    });
    if (!result) {
      throw Error(USER_ONE_SIGNAL_SUBSCRIPTION_ERROR_USER_NOT_FOUND);
    }
    if (result?.user?.password) {
      delete result.user.password;
    }
    return result;
  }

  async create(dto: CreateUserOneSignalSubscriptionDto) {
    return this.ueserFirebaseTokensRepo.manager.transaction(
      async (entityManager) => {
        let userOneSignalSubscription = await entityManager.findOne(
          UserOneSignalSubscription,
          {
            where: {
              subscriptionId: dto.subscriptionId,
            },
            relations: {
              user: true,
            },
          }
        );
        if (!userOneSignalSubscription) {
          userOneSignalSubscription = new UserOneSignalSubscription();

          const user = await entityManager.findOne(Users, {
            where: {
              userId: dto.userId,
              active: true,
            },
          });
          if (!user) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          userOneSignalSubscription.user = user;
          userOneSignalSubscription.subscriptionId = dto.subscriptionId;
        }

        userOneSignalSubscription = await entityManager.save(
          UserOneSignalSubscription,
          userOneSignalSubscription
        );
        delete userOneSignalSubscription.user.password;
        return userOneSignalSubscription;
      }
    );
  }

  // async create(dto: CreateUserOneSignalSubscriptionDto) {
  //   const [logSubs, setExternalUser] = await Promise.all([
  //     this.ueserFirebaseTokensRepo.manager.transaction(
  //       async (entityManager) => {
  //         let userOneSignalSubscription = await entityManager.findOne(
  //           UserOneSignalSubscription,
  //           {
  //             where: {
  //               subscriptionId: dto.subscriptionId,
  //             },
  //             relations: {
  //               user: true,
  //             },
  //           }
  //         );
  //         if (!userOneSignalSubscription) {
  //           userOneSignalSubscription = new UserOneSignalSubscription();

  //           const user = await entityManager.findOne(Users, {
  //             where: {
  //               userId: dto.userId,
  //               active: true,
  //             },
  //           });
  //           if (!user) {
  //             throw Error(USER_ERROR_USER_NOT_FOUND);
  //           }
  //           userOneSignalSubscription.user = user;
  //           userOneSignalSubscription.subscriptionId = dto.subscriptionId;
  //         }

  //         userOneSignalSubscription = await entityManager.save(
  //           UserOneSignalSubscription,
  //           userOneSignalSubscription
  //         );
  //         delete userOneSignalSubscription.user.password;
  //         return userOneSignalSubscription;
  //       }
  //     ),
  //     this.ueserFirebaseTokensRepo.manager.transaction(
  //       async (entityManager) => {
  //         const user = await entityManager.findOne(Users, {
  //           where: {
  //             userId: dto.userId,
  //           },
  //         });
  //         return await this.oneSignalNotificationService.setExternalUserId(
  //           dto.subscriptionId,
  //           user.userName
  //         );
  //       }
  //     ),
  //   ]);
  //   console.log(setExternalUser);
  //   return logSubs;
  // }

  async mobileOneSignalScanner() {
    await this.pusherService.mobileOneSignalScanner();
  }
}
