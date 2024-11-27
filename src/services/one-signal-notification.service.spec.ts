import { Test, TestingModule } from '@nestjs/testing';
import { OneSignalNotificationService } from './one-signal-notification.service';

describe('OneSignalNotificationService', () => {
  let service: OneSignalNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OneSignalNotificationService],
    }).compile();

    service = module.get<OneSignalNotificationService>(OneSignalNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
