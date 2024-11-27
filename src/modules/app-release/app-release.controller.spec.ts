import { Test, TestingModule } from "@nestjs/testing";
import { AppReleaseController } from "./app-release.controller";

describe("AppReleaseController", () => {
  let controller: AppReleaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppReleaseController],
    }).compile();

    controller = module.get<AppReleaseController>(AppReleaseController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
