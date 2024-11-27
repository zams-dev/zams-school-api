import { Test, TestingModule } from "@nestjs/testing";
import { DashboardClientService } from "./dashboard-client.service";

describe("DashboardClientService", () => {
  let service: DashboardClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardClientService],
    }).compile();

    service = module.get<DashboardClientService>(DashboardClientService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
