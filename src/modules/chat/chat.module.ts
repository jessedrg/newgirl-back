import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatSession, ChatSessionSchema } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../../schemas/chat-message.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';
import { Admin, AdminSchema } from '../../schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Girlfriend.name, schema: GirlfriendSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
