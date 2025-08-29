import { Controller } from '@nestjs/common';
import { PlatformAnalyticsService } from './platform-analytics.service';

@Controller('platform-analytics')
export class PlatformAnalyticsController {
  constructor(private readonly platformAnalyticsService: PlatformAnalyticsService) {}
}
