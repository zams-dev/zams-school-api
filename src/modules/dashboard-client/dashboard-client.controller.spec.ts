import { Test, TestingModule } from "@nestjs/testing";
import { DashboardClientController } from "./dashboard-client.controller";

describe("DashboardClientController", () => {
  let controller: DashboardClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardClientController],
    }).compile();

    controller = module.get<DashboardClientController>(
      DashboardClientController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
