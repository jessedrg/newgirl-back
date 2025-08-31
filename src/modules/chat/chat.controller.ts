import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  Delete
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { 
  StartChatDto, 
  SendMessageDto, 
  ChatSessionDto, 
  ChatMessageDto, 
  ChatHistoryDto,
  TypingStatusDto 
} from './dto/chat.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new chat session with a girlfriend' })
  @ApiResponse({ 
    status: 201, 
    description: 'Chat session started successfully',
    type: ChatSessionDto
  })
  @ApiResponse({ status: 400, description: 'Insufficient chat minutes' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found' })
  async startChat(
    @Request() req,
    @Body() startChatDto: StartChatDto
  ): Promise<ChatSessionDto> {
    return this.chatService.startChat(req.user.userId, startChatDto);
  }

  @Post('message')
  @ApiOperation({ summary: 'Send a message in a chat session' })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully',
    type: ChatMessageDto
  })
  @ApiResponse({ status: 400, description: 'Insufficient chat minutes' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async sendMessage(
    @Request() req,
    @Body() sendMessageDto: SendMessageDto
  ): Promise<ChatMessageDto> {
    return this.chatService.sendMessage(req.user.userId, sendMessageDto);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Get or create a chat session (frontend compatibility)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Chat session created or retrieved successfully',
    type: ChatSessionDto
  })
  @ApiResponse({ status: 400, description: 'Insufficient chat minutes' })
  @ApiResponse({ status: 404, description: 'Girlfriend not found' })
  async getOrCreateSession(
    @Request() req,
    @Body() body: { userId: string; girlfriendId: string }
  ): Promise<ChatSessionDto> {
    // Use the existing startChat functionality
    return this.chatService.startChat(req.user.userId, { girlfriendId: body.girlfriendId });
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all chat sessions for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat sessions retrieved successfully',
    type: [ChatSessionDto]
  })
  async getUserChatSessions(@Request() req): Promise<ChatSessionDto[]> {
    return this.chatService.getUserChatSessions(req.user.userId);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get chat messages for a specific session (frontend compatibility)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat messages retrieved successfully',
    type: [ChatMessageDto]
  })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to return (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of messages to skip (default: 0)' })
  async getChatMessages(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ChatMessageDto[]> {
    const history = await this.chatService.getChatHistory(
      req.user.userId, 
      sessionId, 
      limit || 50, 
      offset || 0
    );
    return history.messages;
  }

  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Get chat history for a specific session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat history retrieved successfully',
    type: ChatHistoryDto
  })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to return (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of messages to skip (default: 0)' })
  async getChatHistory(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ChatHistoryDto> {
    return this.chatService.getChatHistory(
      req.user.userId, 
      sessionId, 
      limit || 50, 
      offset || 0
    );
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'End a chat session' })
  @ApiResponse({ status: 200, description: 'Chat session ended successfully' })
  @ApiResponse({ status: 404, description: 'Active chat session not found' })
  async endChatSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<{ message: string }> {
    await this.chatService.endChatSession(req.user.userId, sessionId);
    return { message: 'Chat session ended successfully' };
  }

  @Post('typing')
  @ApiOperation({ summary: 'Update typing status in a chat session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Typing status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sessionId: { type: 'string' },
        isTyping: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async updateTypingStatus(
    @Request() req,
    @Body() typingStatusDto: TypingStatusDto
  ): Promise<{ message: string; sessionId: string; isTyping: boolean }> {
    await this.chatService.updateTypingStatus(req.user.userId, typingStatusDto);
    return { 
      message: 'Typing status updated successfully',
      sessionId: typingStatusDto.sessionId,
      isTyping: typingStatusDto.isTyping
    };
  }

  @Get('girlfriends/:girlfriendId/history')
  @ApiOperation({ summary: 'Get all historical messages between user and specific girlfriend' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historical messages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessageDto' } },
        totalMessages: { type: 'number' },
        hasMore: { type: 'boolean' },
        girlfriendName: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Girlfriend not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to return (default: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of messages to skip (default: 0)' })
  async getUserGirlfriendHistory(
    @Request() req,
    @Param('girlfriendId') girlfriendId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<{
    messages: any[];
    totalMessages: number;
    hasMore: boolean;
    girlfriendName: string;
  }> {
    return this.chatService.getUserGirlfriendHistory(
      req.user.userId,
      girlfriendId,
      limit || 100,
      offset || 0
    );
  }
}
