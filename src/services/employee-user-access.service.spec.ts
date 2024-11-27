import { Test, TestingModule } from "@nestjs/testing";
import { EmployeeUserAccessService } from "./employee-user-access.service";

describe("EmployeeUserAccessService", () => {
  let service: EmployeeUserAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeUserAccessService],
    }).compile();

    service = module.get<EmployeeUserAccessService>(EmployeeUserAccessService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
