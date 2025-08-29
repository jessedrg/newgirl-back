import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GirlfriendsService } from './girlfriends.service';
import {
  CreateGirlfriendBasicDto,
  UpdateGirlfriendPhysicalDto,
  UpdateGirlfriendPersonalityDto,
  FinalizeGirlfriendDto,
  UpdateGirlfriendDto,
  ArchiveGirlfriendDto,
  DeleteGirlfriendDto,
  GenerateAvatarDto,
  GenerateGalleryDto,
  CreateGirlfriendResponseDto,
  GirlfriendResponseDto,
  GirlfriendListResponseDto,
  ErrorResponseDto
} from './dto/girlfriend.dto';

// TODO: Import JWT Auth Guard when implemented
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('girlfriends')
@Controller('girlfriends')
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when JWT guard is implemented
export class GirlfriendsController {
  constructor(private readonly girlfriendsService: GirlfriendsService) {}

  // Step 1: Create basic girlfriend information
  @Post('create/basic')
  @UseGuards(ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize girlfriend creation with basic information' })
  @ApiResponse({ status: 201, description: 'Girlfriend creation started', type: CreateGirlfriendResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Girlfriend limit reached', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Name already exists', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async createBasic(
    @Body() createDto: CreateGirlfriendBasicDto,
    @Request() req: any // TODO: Replace with proper user type when JWT guard is implemented
  ): Promise<CreateGirlfriendResponseDto> {
    // TODO: Extract userId from JWT token
    const userId = req.user?.id || 'temp_user_id'; // Temporary for testing
    return this.girlfriendsService.createBasic(userId, createDto);
  }

  // Step 2: Update physical attributes
  @Put(':id/physical')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure girlfriend physical appearance' })
  @ApiResponse({ status: 200, description: 'Physical attributes updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid session or step', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async updatePhysical(
    @Param('id') girlfriendId: string,
    @Body() updateDto: UpdateGirlfriendPhysicalDto,
    @Headers('x-session-token') sessionToken: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.updatePhysical(userId, girlfriendId, updateDto, sessionToken);
  }

  // Step 3: Update personality configuration
  @Put(':id/personality')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure girlfriend personality and traits' })
  @ApiResponse({ status: 200, description: 'Personality configured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid session or step', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async updatePersonality(
    @Param('id') girlfriendId: string,
    @Body() updateDto: UpdateGirlfriendPersonalityDto,
    @Headers('x-session-token') sessionToken: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.updatePersonality(userId, girlfriendId, updateDto, sessionToken);
  }

  // Step 4: Finalize girlfriend creation
  @Post(':id/finalize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete girlfriend creation and activate AI companion' })
  @ApiResponse({ status: 200, description: 'Girlfriend creation completed successfully' })
  @ApiResponse({ status: 400, description: 'Missing required steps or confirmation', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async finalize(
    @Param('id') girlfriendId: string,
    @Body() finalizeDto: FinalizeGirlfriendDto,
    @Headers('x-session-token') sessionToken: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.finalize(userId, girlfriendId, finalizeDto, sessionToken);
  }

  // Get girlfriend details
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed girlfriend information' })
  @ApiResponse({ status: 200, description: 'Girlfriend details retrieved', type: GirlfriendResponseDto })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async getGirlfriend(
    @Param('id') girlfriendId: string,
    @Request() req: any
  ): Promise<GirlfriendResponseDto> {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.getGirlfriend(userId, girlfriendId);
  }

  // List user's girlfriends
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user\'s girlfriends with filtering and pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'archived', 'creating'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['created', 'lastInteraction', 'name'] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max 100' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Girlfriends list retrieved', type: GirlfriendListResponseDto })
  async listGirlfriends(
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any
  ): Promise<GirlfriendListResponseDto> {
    const userId = req.user?.id || 'temp_user_id';
    const validatedLimit = Math.min(limit || 20, 100);
    const validatedOffset = Math.max(offset || 0, 0);
    
    return this.girlfriendsService.listGirlfriends(
      userId, 
      status, 
      sortBy || 'created', 
      validatedLimit, 
      validatedOffset
    );
  }

  // Update girlfriend (post-creation)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update girlfriend information (limited fields)' })
  @ApiResponse({ status: 200, description: 'Girlfriend updated successfully' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Name already exists', type: ErrorResponseDto })
  async updateGirlfriend(
    @Param('id') girlfriendId: string,
    @Body() updateDto: UpdateGirlfriendDto,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.updateGirlfriend(userId, girlfriendId, updateDto);
  }

  // Archive girlfriend
  @Post(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive girlfriend (temporary deactivation)' })
  @ApiResponse({ status: 200, description: 'Girlfriend archived successfully' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async archiveGirlfriend(
    @Param('id') girlfriendId: string,
    @Body() archiveDto: ArchiveGirlfriendDto,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.archiveGirlfriend(userId, girlfriendId, archiveDto);
  }

  // Delete girlfriend permanently
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete girlfriend and associated data' })
  @ApiResponse({ status: 200, description: 'Girlfriend deleted successfully' })
  @ApiResponse({ status: 400, description: 'Confirmation required', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async deleteGirlfriend(
    @Param('id') girlfriendId: string,
    @Body() deleteDto: DeleteGirlfriendDto,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    return this.girlfriendsService.deleteGirlfriend(userId, girlfriendId, deleteDto);
  }

  // Generate avatar
  @Post(':id/avatar/generate')
  @UseGuards(ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI avatar for girlfriend' })
  @ApiResponse({ status: 200, description: 'Avatar generation started' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async generateAvatar(
    @Param('id') girlfriendId: string,
    @Body() generateDto: GenerateAvatarDto,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    // TODO: Implement avatar generation
    return {
      success: true,
      data: {
        jobId: `avatar_${Date.now()}`,
        status: 'generating',
        estimatedTime: 60
      }
    };
  }

  // Generate gallery images
  @Post(':id/gallery/generate')
  @UseGuards(ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate additional images for girlfriend gallery' })
  @ApiResponse({ status: 200, description: 'Gallery generation started' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async generateGallery(
    @Param('id') girlfriendId: string,
    @Body() generateDto: GenerateGalleryDto,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    // TODO: Implement gallery generation
    return {
      success: true,
      data: {
        jobId: `gallery_${Date.now()}`,
        status: 'generating',
        quantity: generateDto.quantity || 1,
        estimatedTime: (generateDto.quantity || 1) * 45
      }
    };
  }

  // Get girlfriend analytics
  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get girlfriend performance analytics and insights' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found', type: ErrorResponseDto })
  async getAnalytics(
    @Param('id') girlfriendId: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'temp_user_id';
    // TODO: Implement analytics
    return {
      success: true,
      data: {
        engagement: {
          messagesSent: 847,
          averageResponseTime: 2.3,
          conversationRating: 4.8,
          lastInteraction: new Date()
        },
        personality: {
          effectivenessScore: 0.92,
          userSatisfaction: 0.89,
          topTopics: ['daily_life', 'romance', 'hobbies']
        },
        usage: {
          totalChatMinutes: 234,
          averageSessionLength: 18,
          peakUsageHours: ['20:00', '21:00', '22:00']
        }
      }
    };
  }
}
