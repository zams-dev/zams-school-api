import { Test, TestingModule } from "@nestjs/testing";
import { DashboardOrganizationService } from "./DashboardOrganization-organization.service";

describe("DashboardOrganizationService", () => {
  let service: DashboardOrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardOrganizationService],
    }).compile();

    service = module.get<DashboardOrganizationService>(DashboardOrganizationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
