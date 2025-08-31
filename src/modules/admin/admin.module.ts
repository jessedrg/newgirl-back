import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { ChatSession, ChatSessionSchema } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../../schemas/chat-message.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Girlfriend.name, schema: GirlfriendSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
