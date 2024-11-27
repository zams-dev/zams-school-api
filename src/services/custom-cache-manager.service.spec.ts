import { Test, TestingModule } from "@nestjs/testing";
import { CustomCacheManagerService } from "./custom-cache-manager.service";

describe("CustomCacheManagerService", () => {
  let service: CustomCacheManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomCacheManagerService],
    }).compile();

    service = module.get<CustomCacheManagerService>(CustomCacheManagerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
