import { Test, TestingModule } from '@nestjs/testing';
import { AppReleaseService } from './app-release.service';

describe('AppReleaseService', () => {
  let service: AppReleaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppReleaseService],
    }).compile();

    service = module.get<AppReleaseService>(AppReleaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
