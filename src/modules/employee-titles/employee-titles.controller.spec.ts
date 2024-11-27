import { Test, TestingModule } from "@nestjs/testing";
import { EmployeeTitlesController } from "./employee-titles.controller";

describe("EmployeeTitlesController", () => {
  let controller: EmployeeTitlesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeTitlesController],
    }).compile();

    controller = module.get<EmployeeTitlesController>(EmployeeTitlesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
