import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import all feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GirlfriendsModule } from './modules/girlfriends/girlfriends.module';
import { MessagesModule } from './modules/messages/messages.module';
import { StockGirlfriendsModule } from './modules/stock-girlfriends/stock-girlfriends.module';
import { UserSavedGirlfriendsModule } from './modules/user-saved-girlfriends/user-saved-girlfriends.module';
import { UsageTrackingModule } from './modules/usage-tracking/usage-tracking.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { WebhookEventsModule } from './modules/webhook-events/webhook-events.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SubscriptionEventsModule } from './modules/subscription-events/subscription-events.module';
import { GeneratedImagesModule } from './modules/generated-images/generated-images.module';
import { PlatformAnalyticsModule } from './modules/platform-analytics/platform-analytics.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/newgirl'),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    GirlfriendsModule,
    MessagesModule,
    StockGirlfriendsModule,
    UserSavedGirlfriendsModule,
    UsageTrackingModule,
    SubscriptionPlansModule,
    WebhookEventsModule,
    TransactionsModule,
    SubscriptionEventsModule,
    GeneratedImagesModule,
    PlatformAnalyticsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
