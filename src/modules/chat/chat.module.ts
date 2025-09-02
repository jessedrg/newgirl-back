import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SessionTrackingService } from './services/session-tracking.service';
import { SessionTrackingController } from './controllers/session-tracking.controller';
import { UploadService } from './services/upload.service';
import { ChatSession, ChatSessionSchema } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../../schemas/chat-message.schema';
import { ChatSessionTracking, ChatSessionTrackingSchema } from '../../schemas/chat-session-tracking.schema';
import { AdminSessionStats, AdminSessionStatsSchema } from '../../schemas/admin-session-stats.schema';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatSessionTracking.name, schema: ChatSessionTrackingSchema },
      { name: AdminSessionStats.name, schema: AdminSessionStatsSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: User.name, schema: UserSchema },
      { name: Girlfriend.name, schema: GirlfriendSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController, SessionTrackingController],
  providers: [ChatService, ChatGateway, SessionTrackingService, UploadService],
  exports: [ChatService, SessionTrackingService],
})
export class ChatModule {}
