import { Module } from '@nestjs/common';
import { SubscriptionEventsController } from './subscription-events.controller';
import { SubscriptionEventsService } from './subscription-events.service';

@Module({
  controllers: [SubscriptionEventsController],
  providers: [SubscriptionEventsService],
  exports: [SubscriptionEventsService],
})
export class SubscriptionEventsModule {}
