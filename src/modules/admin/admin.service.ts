import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { ChatSession, ChatSessionDocument } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../../schemas/chat-message.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendDocument } from '../../schemas/girlfriend.schema';
import { UserWallet, UserWalletDocument } from '../../schemas/user-wallet.schema';
import { 
  AdminLoginDto, 
  AdminProfileDto, 
  ActiveChatSessionDto, 
  AdminSendMessageDto,
  AssignChatDto,
  AdminStatsDto 
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Girlfriend.name) private girlfriendModel: Model<GirlfriendDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    private jwtService: JwtService,
  ) {}

  // Admin login
  async login(adminLoginDto: AdminLoginDto): Promise<{ accessToken: string; admin: AdminProfileDto }> {
    const admin = await this.adminModel.findOne({ 
      email: adminLoginDto.email,
      isActive: true 
    });

    if (!admin || !await bcrypt.compare(adminLoginDto.password, admin.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and online status
    await this.adminModel.findByIdAndUpdate(admin._id, {
      lastLogin: new Date(),
      isOnline: true
    });

    // Generate JWT token
    const payload = { adminId: admin._id, email: admin.email, role: admin.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' }); // Longer session for admins

    return {
      accessToken,
      admin: this.formatAdminProfile(admin)
    };
  }

  // Admin logout
  async logout(adminId: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(adminId, {
      isOnline: false
    });
  }

  // Get admin profile
  async getAdminProfile(adminId: string): Promise<AdminProfileDto> {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return this.formatAdminProfile(admin);
  }

  // Get all active chat sessions for admin panel
  async getActiveChatSessions(adminId: string): Promise<ActiveChatSessionDto[]> {
    console.log('🔍 Fetching active chat sessions...');
    
    // First, let's see how many total sessions exist
    const totalSessions = await this.chatSessionModel.countDocuments({});
    const activeSessionsCount = await this.chatSessionModel.countDocuments({ status: 'active' });
    
    // Let's see what statuses actually exist
    const statusCounts = await this.chatSessionModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log(`📊 Total sessions in DB: ${totalSessions}, Active sessions: ${activeSessionsCount}`);
    console.log('📈 Status breakdown:', statusCounts);
    
    const sessions = await this.chatSessionModel
      .find({ status: 'active' })
      .populate('userId', 'email profile')
      .populate('girlfriendId', 'name')
      .populate('adminId', 'name')
      .sort({ lastActivity: 1 }) // Oldest first (highest priority)
      .exec();
      
    console.log(`📋 Found ${sessions.length} active sessions after population`);

    // Remove any potential duplicates based on session ID
    const uniqueSessions = sessions.filter((session, index, self) => 
      index === self.findIndex(s => s._id.toString() === session._id.toString())
    );

    const activeSessions: ActiveChatSessionDto[] = [];

    for (const session of uniqueSessions) {
      const user = session.userId as any;
      const girlfriend = session.girlfriendId as any;
      const assignedAdmin = session.adminId as any;

      // Calculate time since last message
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));

      // Determine priority based on wait time
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
      if (minutesAgo > 30) priority = 'urgent';
      else if (minutesAgo > 15) priority = 'high';
      else if (minutesAgo > 5) priority = 'medium';

      // Format time since last message
      let timeSinceLastMessage: string;
      if (minutesAgo < 1) timeSinceLastMessage = 'Just now';
      else if (minutesAgo < 60) timeSinceLastMessage = `${minutesAgo}m ago`;
      else timeSinceLastMessage = `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;

      activeSessions.push({
        id: session._id.toString(),
        userEmail: user?.email || 'Unknown',
        userName: user?.profile?.displayName || user?.profile?.firstName || 'User',
        girlfriendName: girlfriend?.name || 'Unknown',
        status: session.status,
        lastActivity: session.lastActivity,
        totalMessages: session.totalMessages,
        minutesUsed: session.minutesUsed,
        isAdminActive: session.isAdminActive,
        assignedAdminName: assignedAdmin?.name,
        timeSinceLastMessage,
        priority
      });
    }

    return activeSessions;
  }

  // Assign chat session to admin
  async assignChatToAdmin(adminId: string, assignChatDto: AssignChatDto): Promise<void> {
    const targetAdminId = assignChatDto.adminId || adminId;

    // Check if target admin exists and is online
    const targetAdmin = await this.adminModel.findById(targetAdminId);
    if (!targetAdmin || !targetAdmin.isOnline) {
      throw new BadRequestException('Target admin not found or offline');
    }

    // Admin can handle unlimited chats (no capacity limit)

    // Update chat session
    await this.chatSessionModel.findByIdAndUpdate(assignChatDto.sessionId, {
      adminId: new Types.ObjectId(targetAdminId),
      isAdminActive: true
    });

    // Update admin's active chat count
    await this.adminModel.findByIdAndUpdate(targetAdminId, {
      $inc: { activeChatSessions: 1 }
    });
  }

  // Send message as admin (pretending to be girlfriend or as admin support)
  async sendAdminMessage(adminId: string, adminSendMessageDto: AdminSendMessageDto): Promise<void> {
    const session = await this.chatSessionModel.findById(adminSendMessageDto.sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Check if this is the first admin message in this session (start billing)
    const existingAdminMessages = await this.chatMessageModel.countDocuments({
      sessionId: new Types.ObjectId(adminSendMessageDto.sessionId),
      senderType: { $in: ['girlfriend', 'admin'] }
    });

    const isFirstAdminMessage = existingAdminMessages === 0;

    // If first admin message, check user has sufficient credits and start billing
    if (isFirstAdminMessage) {
      const wallet = await this.userWalletModel.findOne({ userId: session.userId });
      if (!wallet || wallet.balance.chatMinutes <= 0) {
        throw new BadRequestException('User has insufficient chat minutes. Cannot start conversation.');
      }

      // Deduct 1 minute for starting the conversation
      await this.userWalletModel.findOneAndUpdate(
        { userId: session.userId },
        { 
          $inc: { 
            'balance.chatMinutes': -1,
            'usage.totalChatMinutesUsed': 1,
            'usage.totalSpent': 100 // Assuming $1 per minute = 100 cents
          }
        }
      );

      // Update session to track billing started
      await this.chatSessionModel.findByIdAndUpdate(adminSendMessageDto.sessionId, {
        $inc: { minutesUsed: 1 }
      });

      // Mark session as billing started - minute counter will be handled by ChatGateway
      await this.chatSessionModel.findByIdAndUpdate(adminSendMessageDto.sessionId, {
        billingStarted: true
      });
      
      console.log('🕐 Billing started for session:', adminSendMessageDto.sessionId);
    }

    // Determine sender type and ID based on sendAs parameter
    let senderType: string;
    let senderId: Types.ObjectId;

    if (adminSendMessageDto.sendAs === 'admin') {
      senderType = 'admin';
      senderId = new Types.ObjectId(adminId);
    } else {
      // Send as girlfriend (default)
      senderType = 'girlfriend';
      senderId = session.girlfriendId;
    }

    // Create message
    const message = new this.chatMessageModel({
      sessionId: new Types.ObjectId(adminSendMessageDto.sessionId),
      senderId: senderId,
      senderType: senderType,
      content: adminSendMessageDto.content,
      messageType: 'text',
      sentAt: new Date(),
      actualSenderId: new Types.ObjectId(adminId) // Track which admin actually sent this
    });

    await message.save();

    // Update session activity
    await this.chatSessionModel.findByIdAndUpdate(adminSendMessageDto.sessionId, {
      $inc: { totalMessages: 1 },
      $set: { 
        lastActivity: new Date(),
        isAdminActive: true,
        adminId: new Types.ObjectId(adminId)
      }
    });
  }

  // Release chat session (unassign admin but keep session active)
  async releaseChatSession(adminId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Update session to remove admin assignment
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      $unset: { adminId: 1 },
      $set: { isAdminActive: false }
    });

    // Update admin's active chat count
    await this.adminModel.findByIdAndUpdate(adminId, {
      $inc: { activeChatSessions: -1 }
    });

    // Pause billing when admin is released
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      billingPaused: true
    });
  }

  // End chat session completely (admin can end any session)
  async endChatSession(adminId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Update session to ended status
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      $set: { 
        status: 'ended',
        endedAt: new Date(),
        isAdminActive: false
      },
      $unset: { adminId: 1 }
    });

    // Update admin's active chat count if they were assigned
    if (session.adminId && session.adminId.toString() === adminId) {
      await this.adminModel.findByIdAndUpdate(adminId, {
        $inc: { activeChatSessions: -1 }
      });
    }
  }

  // Get admin dashboard stats
  async getAdminStats(): Promise<AdminStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalActiveSessions,
      sessionsWaitingForResponse,
      highPrioritySessions,
      onlineAdmins,
      todayMessages
    ] = await Promise.all([
      this.chatSessionModel.countDocuments({ status: 'active' }),
      this.chatSessionModel.countDocuments({ 
        status: 'active', 
        isAdminActive: false 
      }),
      this.chatSessionModel.countDocuments({ 
        status: 'active',
        lastActivity: { $lt: new Date(Date.now() - 15 * 60 * 1000) } // 15+ minutes ago
      }),
      this.adminModel.countDocuments({ isOnline: true }),
      this.chatMessageModel.countDocuments({ 
        sentAt: { $gte: todayStart },
        senderType: { $in: ['girlfriend', 'admin'] }
      })
    ]);

    // Calculate average response time (simplified)
    const averageResponseTime = 45; // Placeholder - would need more complex calculation

    return {
      totalActiveSessions,
      sessionsWaitingForResponse,
      highPrioritySessions,
      onlineAdmins,
      averageResponseTime,
      messagesHandledToday: todayMessages
    };
  }

  // Get chat history for any session (admin access - bypasses ownership check)
  // Returns ALL messages between the user and girlfriend across all sessions
  async getAdminChatHistory(sessionId: string, limit = 50, offset = 0): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestException('Invalid session ID format');
    }
    
    // Find session without user ownership check (admin can access any session)
    const session = await this.chatSessionModel.findById(sessionId)
      .populate('userId', 'email name')
      .populate('girlfriendId', 'name');

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Get all sessions between this user and girlfriend
    const allSessions = await this.chatSessionModel
      .find({ 
        userId: session.userId,
        girlfriendId: session.girlfriendId
      })
      .select('_id')
      .exec();

    const sessionIds = allSessions.map(s => s._id);

    // Get ALL messages between this user and girlfriend across all sessions
    const messages = await this.chatMessageModel
      .find({ sessionId: { $in: sessionIds } })
      .sort({ sentAt: 1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const totalMessages = await this.chatMessageModel.countDocuments({ 
      sessionId: { $in: sessionIds }
    });

    const user = session.userId as any;
    const girlfriend = session.girlfriendId as any;

    return {
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        senderId: msg.senderId.toString(),
        senderType: msg.senderType,
        content: msg.content,
        messageType: msg.messageType,
        sentAt: msg.sentAt,
        isRead: msg.isRead,
        actualSenderId: msg.actualSenderId?.toString()
      })),
      totalMessages,
      hasMore: offset + messages.length < totalMessages,
      sessionInfo: {
        id: session._id.toString(),
        userId: user?._id?.toString(),
        userEmail: user?.email,
        userName: user?.name,
        girlfriendName: girlfriend?.name,
        status: session.status,
        minutesUsed: session.minutesUsed,
        totalMessages: session.totalMessages,
        startedAt: session.startedAt,
        lastActivity: session.lastActivity
      }
    };
  }

  // Get chat session (for WebSocket validation - admin can access any session)
  async getChatSession(sessionId: string): Promise<any> {
    const session = await this.chatSessionModel.findById(sessionId)
      .populate('userId', 'email name')
      .populate('girlfriendId', 'name');

    return session;
  }

  // Send message (for WebSocket - admin sends as girlfriend)
  async sendMessage(adminId: string, messageData: any): Promise<any> {
    const { sessionId, content, messageType = 'text', senderType = 'girlfriend' } = messageData;

    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Create message with admin as actual sender
    const message = new this.chatMessageModel({
      sessionId: new Types.ObjectId(sessionId),
      senderId: session.girlfriendId, // Girlfriend is the apparent sender
      senderType,
      content,
      messageType,
      actualSenderId: new Types.ObjectId(adminId), // Track actual admin sender
      sentAt: new Date()
    });

    await message.save();

    // Update session
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      $inc: { totalMessages: 1 },
      lastActivity: new Date()
    });

    // Handle billing - deduct minute on first admin message
    if (session.totalMessages === 0 || !session.billingStarted) {
      await this.handleBillingForFirstMessage(session.userId.toString());
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        billingStarted: true,
        $inc: { minutesUsed: 1 }
      });
    }

    return {
      id: message._id.toString(),
      senderId: message.senderId.toString(),
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType,
      sentAt: message.sentAt,
      actualSenderId: message.actualSenderId?.toString()
    };
  }

  // Helper method to handle billing for first admin message
  private async handleBillingForFirstMessage(userId: string): Promise<void> {
    // Deduct 1 minute from user's wallet
    const updatedWallet = await this.userWalletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { 'balance.chatMinutes': -1, 'usage.totalChatMinutesUsed': 1 } },
      { new: true }
    );

    console.log(`[ADMIN SERVICE] First admin message - deducted 1 minute. New balance: ${updatedWallet?.balance?.chatMinutes}`);
  }

  // Get available admin for auto-assignment (least busy online admin)
  async getAvailableAdmin(): Promise<AdminDocument | null> {
    const availableAdmin = await this.adminModel
      .findOne({ 
        isOnline: true, 
        isActive: true 
      })
      .sort({ activeChatSessions: 1 }) // Get admin with least active chats
      .exec();

    return availableAdmin;
  }

  // Auto-assign chat session to available admin
  async autoAssignChatSession(sessionId: string): Promise<boolean> {
    const availableAdmin = await this.getAvailableAdmin();
    
    if (!availableAdmin) {
      return false; // No available admin
    }

    // Update chat session with admin assignment
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      adminId: availableAdmin._id,
      isAdminActive: false // Admin not actively chatting yet, just assigned
    });

    // Update admin's active chat count
    await this.adminModel.findByIdAndUpdate(availableAdmin._id, {
      $inc: { activeChatSessions: 1 }
    });

    return true;
  }

  // Helper method to format admin profile
  private formatAdminProfile(admin: AdminDocument): AdminProfileDto {
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      isOnline: admin.isOnline,
      activeChatSessions: admin.activeChatSessions,
      specialties: admin.specialties,
      lastLogin: admin.lastLogin
    };
  }
}
