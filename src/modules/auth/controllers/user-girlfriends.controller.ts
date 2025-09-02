import { 
  Controller, 
  Post, 
  Delete, 
  Get, 
  Param, 
  UseGuards, 
  Request,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserGirlfriendsService } from '../services/user-girlfriends.service';

@Controller('user/girlfriends')
@UseGuards(JwtAuthGuard)
export class UserGirlfriendsController {
  constructor(private readonly userGirlfriendsService: UserGirlfriendsService) {}

  @Post(':girlfriendId/save')
  @HttpCode(HttpStatus.OK)
  async saveGirlfriend(
    @Param('girlfriendId') girlfriendId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.userGirlfriendsService.saveGirlfriend(userId, girlfriendId);
  }

  @Delete(':girlfriendId/unsave')
  @HttpCode(HttpStatus.OK)
  async unsaveGirlfriend(
    @Param('girlfriendId') girlfriendId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.userGirlfriendsService.unsaveGirlfriend(userId, girlfriendId);
  }

  @Get('saved')
  async getSavedGirlfriends(@Request() req: any) {
    const userId = req.user.userId;
    return this.userGirlfriendsService.getSavedGirlfriends(userId);
  }

  @Get('saved/ids')
  async getSavedGirlfriendIds(@Request() req: any) {
    const userId = req.user.userId;
    const savedIds = await this.userGirlfriendsService.getSavedGirlfriendIds(userId);
    return { savedGirlfriendIds: savedIds };
  }

  @Get(':girlfriendId/is-saved')
  async isGirlfriendSaved(
    @Param('girlfriendId') girlfriendId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    const isSaved = await this.userGirlfriendsService.isGirlfriendSaved(userId, girlfriendId);
    return { isSaved };
  }
}
