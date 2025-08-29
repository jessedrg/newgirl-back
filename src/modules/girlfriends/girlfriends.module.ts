import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GirlfriendsController } from './girlfriends.controller';
import { GirlfriendsService } from './girlfriends.service';
import { Girlfriend, GirlfriendSchema } from '../../schemas/girlfriend.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Girlfriend.name, schema: GirlfriendSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [GirlfriendsController],
  providers: [GirlfriendsService],
  exports: [GirlfriendsService],
})
export class GirlfriendsModule {}
