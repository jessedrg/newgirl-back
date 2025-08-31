import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UploadService } from './services/upload.service';
import { ChatSession, ChatSessionSchema } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../../schemas/chat-message.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Girlfriend.name, schema: GirlfriendSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, UploadService],
  exports: [ChatService, ChatGateway, UploadService],
})
export class ChatModule {}
