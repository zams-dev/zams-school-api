import { Test, TestingModule } from '@nestjs/testing';
import { LinkStudentRequestService } from './link-student-request.service';

describe('LinkStudentRequestService', () => {
  let service: LinkStudentRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkStudentRequestService],
    }).compile();

    service = module.get<LinkStudentRequestService>(LinkStudentRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
