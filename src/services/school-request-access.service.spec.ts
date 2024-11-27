import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRequestAccessService } from './school-request-access.service';

describe('SchoolRequestAccessService', () => {
  let service: SchoolRequestAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolRequestAccessService],
    }).compile();

    service = module.get<SchoolRequestAccessService>(SchoolRequestAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
