import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsMongoId, IsNotEmpty, IsBoolean } from 'class-validator';

export class StartChatDto {
  @ApiProperty({ description: 'ID of the girlfriend to chat with' })
  @IsMongoId()
  girlfriendId: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsMongoId()
  sessionId: string;

  @ApiProperty({ description: 'Message content (optional for image/audio messages)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ 
    description: 'Message type', 
    enum: ['text', 'image', 'audio', 'emoji'],
    default: 'text'
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'audio', 'emoji'])
  messageType?: string = 'text';
}

export class ChatSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Girlfriend ID' })
  girlfriendId: string;

  @ApiProperty({ description: 'Girlfriend name' })
  girlfriendName: string;

  @ApiProperty({ description: 'Session status' })
  status: string;

  @ApiProperty({ description: 'Admin handling this chat (if any)' })
  adminId?: string;

  @ApiProperty({ description: 'Admin name (if assigned)' })
  adminName?: string;

  @ApiProperty({ description: 'When chat started' })
  startedAt: Date;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date;

  @ApiProperty({ description: 'Total messages in this session' })
  totalMessages: number;

  @ApiProperty({ description: 'Minutes used (for billing)' })
  minutesUsed: number;

  @ApiProperty({ description: 'Is admin currently active in chat' })
  isAdminActive: boolean;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Sender ID' })
  senderId: string;

  @ApiProperty({ description: 'Sender type' })
  senderType: 'user' | 'girlfriend' | 'admin';

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Message type' })
  messageType: string;

  @ApiProperty({ description: 'Is message read' })
  isRead: boolean;

  @ApiProperty({ description: 'When message was sent' })
  sentAt: Date;

  @ApiProperty({ description: 'Is message edited' })
  isEdited: boolean;
}

export class ChatHistoryDto {
  @ApiProperty({ description: 'Messages in this chat', type: [ChatMessageDto] })
  messages: ChatMessageDto[];

  @ApiProperty({ description: 'Total message count' })
  totalMessages: number;

  @ApiProperty({ description: 'Has more messages (pagination)' })
  hasMore: boolean;
}

export class TypingStatusDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Whether user is typing' })
  @IsBoolean()
  isTyping: boolean;
}
