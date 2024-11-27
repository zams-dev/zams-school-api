import { Test, TestingModule } from '@nestjs/testing';
import { DateTimeCheckerController } from './date-time-checker.controller';
import { DateTimeCheckerService } from './date-time-checker.service';

describe('DateTimeCheckerController', () => {
  let controller: DateTimeCheckerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DateTimeCheckerController],
      providers: [DateTimeCheckerService],
    }).compile();

    controller = module.get<DateTimeCheckerController>(DateTimeCheckerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
