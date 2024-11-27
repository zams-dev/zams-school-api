import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeTitlesService } from './employee-titles.service';

describe('EmployeeTitlesService', () => {
  let service: EmployeeTitlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeTitlesService],
    }).compile();

    service = module.get<EmployeeTitlesService>(EmployeeTitlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
