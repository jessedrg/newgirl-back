import { Module } from '@nestjs/common';
import { UserSavedGirlfriendsController } from './user-saved-girlfriends.controller';
import { UserSavedGirlfriendsService } from './user-saved-girlfriends.service';

@Module({
  controllers: [UserSavedGirlfriendsController],
  providers: [UserSavedGirlfriendsService],
  exports: [UserSavedGirlfriendsService],
})
export class UserSavedGirlfriendsModule {}
