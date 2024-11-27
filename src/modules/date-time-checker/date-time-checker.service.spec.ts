import { Test, TestingModule } from '@nestjs/testing';
import { DateTimeCheckerService } from './date-time-checker.service';

describe('DateTimeCheckerService', () => {
  let service: DateTimeCheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DateTimeCheckerService],
    }).compile();

    service = module.get<DateTimeCheckerService>(DateTimeCheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
