import { Test, TestingModule } from "@nestjs/testing";
import { EmployeeUserAccessController } from "./employee-user-access.controller";

describe("EmployeeUserAccessController", () => {
  let controller: EmployeeUserAccessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeUserAccessController],
    }).compile();

    controller = module.get<EmployeeUserAccessController>(
      EmployeeUserAccessController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
