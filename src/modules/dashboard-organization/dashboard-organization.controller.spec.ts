import { Test, TestingModule } from "@nestjs/testing";
import { DashboardOrganizationController } from "./dashboard-organization.controller";

describe("DashboardOrganizationController", () => {
  let controller: DashboardOrganizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardOrganizationController],
    }).compile();

    controller = module.get<DashboardOrganizationController>(
      DashboardOrganizationController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
