import { Module } from '@nestjs/common';
import { UsageTrackingController } from './usage-tracking.controller';
import { UsageTrackingService } from './usage-tracking.service';

@Module({
  controllers: [UsageTrackingController],
  providers: [UsageTrackingService],
  exports: [UsageTrackingService],
})
export class UsageTrackingModule {}
