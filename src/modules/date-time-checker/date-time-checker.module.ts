import { Module } from '@nestjs/common';
import { DateTimeCheckerService } from './date-time-checker.service';
import { DateTimeCheckerController } from './date-time-checker.controller';

@Module({
  controllers: [DateTimeCheckerController],
  providers: [DateTimeCheckerService]
})
export class DateTimeCheckerModule {}
