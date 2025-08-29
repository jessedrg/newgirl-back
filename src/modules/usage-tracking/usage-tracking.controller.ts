import { Controller } from '@nestjs/common';
import { UsageTrackingService } from './usage-tracking.service';

@Controller('usage-tracking')
export class UsageTrackingController {
  constructor(private readonly usageTrackingService: UsageTrackingService) {}
}
