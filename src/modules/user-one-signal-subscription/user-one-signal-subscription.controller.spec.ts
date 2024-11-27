import { Test, TestingModule } from "@nestjs/testing";
import { UserOneSignalSubscriptionController } from "./user-one-signal-subscription.controller";

describe("UserOneSignalSubscriptionController", () => {
  let controller: UserOneSignalSubscriptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserOneSignalSubscriptionController],
    }).compile();

    controller = module.get<UserOneSignalSubscriptionController>(
      UserOneSignalSubscriptionController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
