import { Test, TestingModule } from "@nestjs/testing";
import { StrandsController } from "./strands.controller";

describe("StrandsController", () => {
  let controller: StrandsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrandsController],
    }).compile();

    controller = module.get<StrandsController>(StrandsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
