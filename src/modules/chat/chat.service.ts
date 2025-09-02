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

    // Create new chat session with duplicate handling
    try {
      const newSession = new this.chatSessionModel({
        userId: new Types.ObjectId(userId),
        girlfriendId: new Types.ObjectId(startChatDto.girlfriendId),
        status: 'active',
        startedAt: new Date(),
        lastActivity: new Date(),
      });

      await newSession.save();
      console.log('✅ New chat session created:', {
        sessionId: newSession._id,
        userId,
        girlfriendId: startChatDto.girlfriendId,
        status: newSession.status
      });
      
      return this.formatChatSession(newSession, girlfriend);
    } catch (error) {
      // Handle duplicate key error - fetch existing session
      if (error.code === 11000) {
        const existingSession = await this.chatSessionModel.findOne({
          userId: new Types.ObjectId(userId),
          girlfriendId: new Types.ObjectId(startChatDto.girlfriendId),
          status: 'active'
        });
        
        if (existingSession) {
          return this.formatChatSession(existingSession, girlfriend);
        }
      }
      throw error;
    }
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

    // Check user has chat minutes (but don't deduct yet - billing starts when admin responds)
    const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet || wallet.balance.chatMinutes <= 0) {
      throw new BadRequestException('Insufficient chat minutes');
    }

    // Validate content is provided
    if (!sendMessageDto.content) {
      throw new BadRequestException('Message content is required');
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

    // Update session stats (but don't deduct minutes yet)
    await this.chatSessionModel.findByIdAndUpdate(sendMessageDto.sessionId, {
      $inc: { totalMessages: 1 },
      $set: { lastActivity: new Date() }
    });

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

    // Get messages using session._id directly for consistency
    const messages = await this.chatMessageModel
      .find({ sessionId: session._id })
      .sort({ sentAt: 1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const totalMessages = await this.chatMessageModel.countDocuments({ 
      sessionId: session._id 
    });

    const girlfriend = session.girlfriendId as any;

    return {
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

  // Get all historical messages between user and specific girlfriend (across all sessions)
  async getUserGirlfriendHistory(userId: string, girlfriendId: string, limit = 100, offset = 0): Promise<{
    messages: ChatMessageDto[];
    totalMessages: number;
    hasMore: boolean;
    girlfriendName: string;
  }> {
    // Verify girlfriend exists
    const girlfriend = await this.girlfriendModel.findById(girlfriendId);
    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    // Get all sessions between this user and girlfriend
    const sessions = await this.chatSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        girlfriendId: new Types.ObjectId(girlfriendId)
      })
      .select('_id')
      .exec();

    const sessionIds = sessions.map(session => session._id);

    if (sessionIds.length === 0) {
      return {
        messages: [],
        totalMessages: 0,
        hasMore: false,
        girlfriendName: girlfriend.name
      };
    }

    // Get messages from all sessions
    const messages = await this.chatMessageModel
      .find({ sessionId: { $in: sessionIds } })
      .sort({ sentAt: -1 }) // Most recent first
      .skip(offset)
      .limit(limit)
      .exec();

    // Get total message count
    const totalMessages = await this.chatMessageModel.countDocuments({
      sessionId: { $in: sessionIds }
    });

    return { 
      messages: messages.reverse().map(msg => this.formatChatMessage(msg)), // Reverse to show chronological order
      totalMessages, 
      hasMore: offset + messages.length < totalMessages, 
      girlfriendName: girlfriend.name 
    };
  }

  // Update typing status for a chat session
  async updateTypingStatus(userId: string, typingStatusDto: any): Promise<void> {
    const session = await this.chatSessionModel.findById(typingStatusDto.sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Verify the session belongs to the user
    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update typing status for your own chat sessions');
    }

    // Update the session with typing status and last activity
    await this.chatSessionModel.findByIdAndUpdate(typingStatusDto.sessionId, {
      $set: { 
        lastActivity: new Date(),
        isUserTyping: typingStatusDto.isTyping
      }
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

  // Pause session billing (when admin disconnects)
  async pauseSessionBilling(sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Only pause if session is active and billing is not already paused
    if (session.status === 'active' && !session.billingPaused) {
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        billingPaused: true,
        billingPausedAt: new Date(),
        lastActivity: new Date()
      });
    }
  }

  // Resume session billing (when admin reconnects)
  async resumeSessionBilling(sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Only resume if session is active and billing is paused
    if (session.status === 'active' && session.billingPaused) {
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        billingPaused: false,
        $unset: { billingPausedAt: 1 },
        lastActivity: new Date()
      });
    }
  }

  // Get chat session (for WebSocket validation)
  async getChatSession(userId: string, sessionId: string): Promise<any> {
    const session = await this.chatSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId)
    }).populate('girlfriendId', 'name');

    return session;
  }
}
