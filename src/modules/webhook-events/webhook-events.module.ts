import { Module } from '@nestjs/common';
import { WebhookEventsController } from './webhook-events.controller';
import { WebhookEventsService } from './webhook-events.service';

@Module({
  controllers: [WebhookEventsController],
  providers: [WebhookEventsService],
  exports: [WebhookEventsService],
})
export class WebhookEventsModule {}
