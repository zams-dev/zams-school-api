import { Test, TestingModule } from "@nestjs/testing";
import { UserOneSignalSubscriptionService } from "./user-one-signal-subscription.service";

describe("UserOneSignalSubscriptionService", () => {
  let service: UserOneSignalSubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserOneSignalSubscriptionService],
    }).compile();

    service = module.get<UserOneSignalSubscriptionService>(
      UserOneSignalSubscriptionService
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
