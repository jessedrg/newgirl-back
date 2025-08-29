import { Controller } from '@nestjs/common';
import { SubscriptionEventsService } from './subscription-events.service';

@Controller('subscription-events')
export class SubscriptionEventsController {
  constructor(private readonly subscriptionEventsService: SubscriptionEventsService) {}
}
