import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearLevelsService } from './school-year-levels.service';

describe('SchoolYearLevelsService', () => {
  let service: SchoolYearLevelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolYearLevelsService],
    }).compile();

    service = module.get<SchoolYearLevelsService>(SchoolYearLevelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
