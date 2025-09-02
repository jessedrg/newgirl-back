import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserGirlfriendsController } from './controllers/user-girlfriends.controller';
import { UserGirlfriendsService } from './services/user-girlfriends.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Girlfriend.name, schema: GirlfriendSchema }
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
  ],
  controllers: [AuthController, UserGirlfriendsController],
  providers: [AuthService, UserGirlfriendsService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
