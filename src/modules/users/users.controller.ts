import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Request, 
  UseGuards,
  NotFoundException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get logged-in user profile', 
    description: 'Retrieve complete user profile including balance, usage statistics, subscription info, and recent transaction history' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully', 
    type: UserProfileDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async getUserProfile(@Request() req): Promise<UserProfileDto> {
    try {
      return await this.usersService.getUserProfile(req.user.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`User profile not found: ${error.message}`);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get basic user information', 
    description: 'Retrieve basic user account information without wallet/payment data' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User information retrieved successfully' 
  })
  async getBasicProfile(@Request() req) {
    const user = await this.usersService.getUserById(req.user.userId);
    
    // Get user display name
    const displayName = user.profile?.displayName || 
                       (user.profile?.firstName && user.profile?.lastName 
                         ? `${user.profile.firstName} ${user.profile.lastName}` 
                         : 'User');

    return {
      userId: user._id.toString(),
      email: user.email,
      name: displayName,
      profile: user.profile,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: (user as any).createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
