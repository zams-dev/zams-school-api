import { Test, TestingModule } from "@nestjs/testing";
import { SchoolYearLevelsController } from "./school-year-levels.controller";

describe("SchoolYearLevelsController", () => {
  let controller: SchoolYearLevelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolYearLevelsController],
    }).compile();

    controller = module.get<SchoolYearLevelsController>(
      SchoolYearLevelsController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
