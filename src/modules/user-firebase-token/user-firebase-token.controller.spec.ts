import { Test, TestingModule } from '@nestjs/testing';
import { UserFirebaseTokenController } from './user-firebase-token.controller';

describe('UserFirebaseTokenController', () => {
  let controller: UserFirebaseTokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserFirebaseTokenController],
    }).compile();

    controller = module.get<UserFirebaseTokenController>(UserFirebaseTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
