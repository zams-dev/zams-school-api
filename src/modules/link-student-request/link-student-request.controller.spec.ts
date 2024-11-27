import { Test, TestingModule } from "@nestjs/testing";
import { LinkStudentRequestController } from "./link-student-request.controller";

describe("LinkStudentRequestController", () => {
  let controller: LinkStudentRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkStudentRequestController],
    }).compile();

    controller = module.get<LinkStudentRequestController>(
      LinkStudentRequestController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
