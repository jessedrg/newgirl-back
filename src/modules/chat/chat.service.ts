import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession, ChatSessionDocument } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../../schemas/chat-message.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Girlfriend, GirlfriendDocument } from '../../schemas/girlfriend.schema';
import { UserWallet, UserWalletDocument } from '../../schemas/user-wallet.schema';
import { StartChatDto, SendMessageDto, ChatSessionDto, ChatMessageDto, ChatHistoryDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Girlfriend.name) private girlfriendModel: Model<GirlfriendDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
  ) {}

  // Start a new chat session with a girlfriend
  async startChat(userId: string, startChatDto: StartChatDto): Promise<ChatSessionDto> {
    // Check if user has sufficient chat minutes
    const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet || wallet.balance.chatMinutes <= 0) {
      throw new BadRequestException('Insufficient chat minutes. Please purchase more credits.');
    }

    // Verify girlfriend exists
    const girlfriend = await this.girlfriendModel.findById(startChatDto.girlfriendId);
    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    // Check if user already has an active chat with this girlfriend
    const existingSession = await this.chatSessionModel.findOne({
      userId: new Types.ObjectId(userId),
      girlfriendId: new Types.ObjectId(startChatDto.girlfriendId),
      status: 'active'
    });

    if (existingSession) {
      // Return existing session
      return this.formatChatSession(existingSession, girlfriend);
    }

    // Create new chat session
    const newSession = new this.chatSessionModel({
      userId: new Types.ObjectId(userId),
      girlfriendId: new Types.ObjectId(startChatDto.girlfriendId),
      status: 'active',
      startedAt: new Date(),
      lastActivity: new Date(),
    });

    await newSession.save();

    return this.formatChatSession(newSession, girlfriend);
  }

  // Send a message in a chat session
  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<ChatMessageDto> {
    // Verify session exists and user owns it
    const session = await this.chatSessionModel.findOne({
      _id: new Types.ObjectId(sendMessageDto.sessionId),
      userId: new Types.ObjectId(userId),
      status: 'active'
    });

    if (!session) {
      throw new NotFoundException('Chat session not found or not active');
    }

    // Check user has chat minutes
    const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet || wallet.balance.chatMinutes <= 0) {
      throw new BadRequestException('Insufficient chat minutes');
    }

    // Create message
    const message = new this.chatMessageModel({
      sessionId: new Types.ObjectId(sendMessageDto.sessionId),
      senderId: new Types.ObjectId(userId),
      senderType: 'user',
      content: sendMessageDto.content,
      messageType: sendMessageDto.messageType || 'text',
      sentAt: new Date(),
    });

    await message.save();

    // Update session stats
    await this.chatSessionModel.findByIdAndUpdate(sendMessageDto.sessionId, {
      $inc: { totalMessages: 1 },
      $set: { lastActivity: new Date() }
    });

    // Deduct 1 minute from user wallet (simplified billing)
    await this.userWalletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { 
        $inc: { 
          'balance.chatMinutes': -1,
          'usage.totalChatMinutesUsed': 1 
        }
      }
    );

    return this.formatChatMessage(message);
  }

  // Get chat history for a session
  async getChatHistory(userId: string, sessionId: string, limit = 50, offset = 0): Promise<ChatHistoryDto> {
    // Verify session belongs to user
    const session = await this.chatSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId)
    }).populate('girlfriendId');

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Get messages
    const messages = await this.chatMessageModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ sentAt: 1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const totalMessages = await this.chatMessageModel.countDocuments({ 
      sessionId: new Types.ObjectId(sessionId) 
    });

    const girlfriend = session.girlfriendId as any;

    return {
      session: this.formatChatSession(session, girlfriend),
      messages: messages.map(msg => this.formatChatMessage(msg)),
      totalMessages,
      hasMore: offset + messages.length < totalMessages
    };
  }

  // Get user's chat sessions
  async getUserChatSessions(userId: string): Promise<ChatSessionDto[]> {
    const sessions = await this.chatSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('girlfriendId')
      .sort({ lastActivity: -1 })
      .exec();

    return sessions.map(session => {
      const girlfriend = session.girlfriendId as any;
      return this.formatChatSession(session, girlfriend);
    });
  }

  // End a chat session
  async endChatSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      status: 'active'
    });

    if (!session) {
      throw new NotFoundException('Active chat session not found');
    }

    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      status: 'ended',
      endedAt: new Date()
    });
  }

  // Helper methods
  private formatChatSession(session: ChatSessionDocument, girlfriend: any): ChatSessionDto {
    return {
      id: session._id.toString(),
      userId: session.userId.toString(),
      girlfriendId: session.girlfriendId.toString(),
      girlfriendName: girlfriend?.name || 'Unknown',
      status: session.status,
      adminId: session.adminId?.toString(),
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
      totalMessages: session.totalMessages,
      minutesUsed: session.minutesUsed,
      isAdminActive: session.isAdminActive
    };
  }

  private formatChatMessage(message: ChatMessageDocument): ChatMessageDto {
    return {
      id: message._id.toString(),
      sessionId: message.sessionId.toString(),
      senderId: message.senderId.toString(),
      senderType: message.senderType as 'user' | 'girlfriend' | 'admin',
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      sentAt: message.sentAt,
      isEdited: message.isEdited
    };
  }
}
