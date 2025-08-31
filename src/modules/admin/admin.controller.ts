import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  Delete,
  Put,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { 
  AdminLoginDto, 
  AdminProfileDto, 
  ActiveChatSessionDto, 
  AdminSendMessageDto,
  AssignChatDto,
  AdminStatsDto 
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin logged in successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        admin: { $ref: '#/components/schemas/AdminProfileDto' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminService.login(adminLoginDto);
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Admin logged out successfully' })
  async logout(@Request() req): Promise<{ message: string }> {
    await this.adminService.logout(req.user.adminId);
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin profile retrieved successfully',
    type: AdminProfileDto
  })
  async getProfile(@Request() req): Promise<AdminProfileDto> {
    return this.adminService.getAdminProfile(req.user.adminId);
  }

  @Get('chats/active')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active chat sessions for admin panel' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active chat sessions retrieved successfully',
    type: [ActiveChatSessionDto]
  })
  async getActiveChatSessions(@Request() req): Promise<ActiveChatSessionDto[]> {
    return this.adminService.getActiveChatSessions(req.user.adminId);
  }

  @Put('chats/assign')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign chat session to admin' })
  @ApiResponse({ status: 200, description: 'Chat assigned successfully' })
  @ApiResponse({ status: 400, description: 'Admin at capacity or offline' })
  async assignChat(
    @Request() req,
    @Body() assignChatDto: AssignChatDto
  ): Promise<{ message: string }> {
    await this.adminService.assignChatToAdmin(req.user.adminId, assignChatDto);
    return { message: 'Chat assigned successfully' };
  }

  @Post('chats/message')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message as admin (as girlfriend or admin support)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async sendMessage(
    @Request() req,
    @Body() adminSendMessageDto: AdminSendMessageDto
  ): Promise<{ message: string }> {
    await this.adminService.sendAdminMessage(req.user.adminId, adminSendMessageDto);
    return { message: 'Message sent successfully' };
  }

  @Delete('chats/:sessionId/release')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release chat session (unassign admin)' })
  @ApiResponse({ status: 200, description: 'Chat released successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async releaseChatSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<{ message: string }> {
    await this.adminService.releaseChatSession(req.user.adminId, sessionId);
    return { message: 'Chat released successfully' };
  }

  @Delete('chats/:sessionId/end')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End chat session completely (admin)' })
  @ApiResponse({ status: 200, description: 'Chat session ended successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async endChatSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<{ message: string }> {
    await this.adminService.endChatSession(req.user.adminId, sessionId);
    return { message: 'Chat session ended successfully' };
  }

  @Get('stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin stats retrieved successfully',
    type: AdminStatsDto
  })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminService.getAdminStats();
  }

  @Get('chats/:sessionId/history')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chat history for any session (admin access)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messages: { type: 'array' },
        totalMessages: { type: 'number' },
        hasMore: { type: 'boolean' },
        sessionInfo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            userEmail: { type: 'string' },
            girlfriendName: { type: 'string' },
            status: { type: 'string' },
            minutesUsed: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async getAdminChatHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<any> {
    return this.adminService.getAdminChatHistory(sessionId, limit || 50, offset || 0);
  }
}
