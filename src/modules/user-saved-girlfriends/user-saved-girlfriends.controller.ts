import { Controller } from '@nestjs/common';
import { UserSavedGirlfriendsService } from './user-saved-girlfriends.service';

@Controller('user-saved-girlfriends')
export class UserSavedGirlfriendsController {
  constructor(private readonly userSavedGirlfriendsService: UserSavedGirlfriendsService) {}
}
