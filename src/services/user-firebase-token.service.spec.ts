import { Test, TestingModule } from "@nestjs/testing";
import { UserFirebaseTokenService } from "./user-firebase-token.service";

describe("UserFirebaseTokenService", () => {
  let service: UserFirebaseTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserFirebaseTokenService],
    }).compile();

    service = module.get<UserFirebaseTokenService>(UserFirebaseTokenService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
