import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseCloudMessagingService } from './firebase-cloud-messaging.service';

describe('FirebaseCloudMessagingService', () => {
  let service: FirebaseCloudMessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseCloudMessagingService],
    }).compile();

    service = module.get<FirebaseCloudMessagingService>(FirebaseCloudMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
