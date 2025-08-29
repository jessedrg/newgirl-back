import { Controller } from '@nestjs/common';
import { WebhookEventsService } from './webhook-events.service';

@Controller('webhook-events')
export class WebhookEventsController {
  constructor(private readonly webhookEventsService: WebhookEventsService) {}
}
