import { Test, TestingModule } from "@nestjs/testing";
import { TapLogsController } from "./tap-logs.controller";

describe("TapLogsController", () => {
  let controller: TapLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TapLogsController],
    }).compile();

    controller = module.get<TapLogsController>(TapLogsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
