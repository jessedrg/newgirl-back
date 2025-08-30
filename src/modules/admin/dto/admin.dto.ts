import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Admin password' })
  @IsString()
  password: string;
}

export class AdminProfileDto {
  @ApiProperty({ description: 'Admin ID' })
  id: string;

  @ApiProperty({ description: 'Admin email' })
  email: string;

  @ApiProperty({ description: 'Admin name' })
  name: string;

  @ApiProperty({ description: 'Admin role' })
  role: string;

  @ApiProperty({ description: 'Is admin active' })
  isActive: boolean;

  @ApiProperty({ description: 'Is admin currently online' })
  isOnline: boolean;

  @ApiProperty({ description: 'Number of active chat sessions' })
  activeChatSessions: number;

  @ApiProperty({ description: 'Maximum concurrent chats allowed' })
  maxConcurrentChats: number;

  @ApiProperty({ description: 'Admin specialties/tags' })
  specialties: string[];

  @ApiProperty({ description: 'Last login timestamp' })
  lastLogin: Date | null;
}

export class ActiveChatSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'User email (for admin reference)' })
  userEmail: string;

  @ApiProperty({ description: 'User name/display name' })
  userName: string;

  @ApiProperty({ description: 'Girlfriend name' })
  girlfriendName: string;

  @ApiProperty({ description: 'Session status' })
  status: string;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date;

  @ApiProperty({ description: 'Total messages in session' })
  totalMessages: number;

  @ApiProperty({ description: 'Minutes used in session' })
  minutesUsed: number;

  @ApiProperty({ description: 'Is admin currently handling this chat' })
  isAdminActive: boolean;

  @ApiProperty({ description: 'Admin currently assigned (if any)' })
  assignedAdminName?: string;

  @ApiProperty({ description: 'Time since last user message' })
  timeSinceLastMessage: string;

  @ApiProperty({ description: 'Priority level based on wait time' })
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class AdminSendMessageDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({ 
    description: 'Send as girlfriend or as admin support',
    enum: ['girlfriend', 'admin'],
    default: 'girlfriend'
  })
  @IsOptional()
  @IsEnum(['girlfriend', 'admin'])
  sendAs?: string = 'girlfriend';
}

export class AssignChatDto {
  @ApiProperty({ description: 'Chat session ID to assign' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Admin ID to assign (optional - defaults to current admin)' })
  @IsOptional()
  @IsString()
  adminId?: string;
}

export class AdminStatsDto {
  @ApiProperty({ description: 'Total active chat sessions' })
  totalActiveSessions: number;

  @ApiProperty({ description: 'Sessions waiting for admin response' })
  sessionsWaitingForResponse: number;

  @ApiProperty({ description: 'Sessions with high priority' })
  highPrioritySessions: number;

  @ApiProperty({ description: 'Total online admins' })
  onlineAdmins: number;

  @ApiProperty({ description: 'Average response time today (seconds)' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Total messages handled today' })
  messagesHandledToday: number;
}
