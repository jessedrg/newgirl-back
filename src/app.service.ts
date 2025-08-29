import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NewGirl Platform Core Service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getVersion(): object {
    return {
      version: '1.0.0',
      name: 'NewGirl Platform API',
      description: 'AI Girlfriend Platform Core Service',
      author: 'NewGirl Team',
      buildDate: new Date().toISOString(),
    };
  }
}
