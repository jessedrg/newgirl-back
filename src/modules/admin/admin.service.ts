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
    const sessions = await this.chatSessionModel
      .find({ status: 'active' })
      .populate('userId', 'email profile')
      .populate('girlfriendId', 'name')
      .populate('adminId', 'name')
      .sort({ lastActivity: 1 }) // Oldest first (highest priority)
      .exec();

    const activeSessions: ActiveChatSessionDto[] = [];

    for (const session of sessions) {
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

    // Check if admin has capacity for more chats
    if (targetAdmin.activeChatSessions >= targetAdmin.maxConcurrentChats) {
      throw new BadRequestException('Admin has reached maximum concurrent chat limit');
    }

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

  // Release chat session (admin stops handling it)
  async releaseChatSession(adminId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session || session.adminId?.toString() !== adminId) {
      throw new NotFoundException('Chat session not found or not assigned to this admin');
    }

    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      $unset: { adminId: 1 },
      isAdminActive: false
    });

    // Update admin's active chat count
    await this.adminModel.findByIdAndUpdate(adminId, {
      $inc: { activeChatSessions: -1 }
    });
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
      maxConcurrentChats: admin.maxConcurrentChats,
      specialties: admin.specialties,
      lastLogin: admin.lastLogin
    };
  }
}
