import { Test, TestingModule } from '@nestjs/testing';
import { TapLogsService } from './tap-logs.service';

describe('TapLogsService', () => {
  let service: TapLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TapLogsService],
    }).compile();

    service = module.get<TapLogsService>(TapLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
