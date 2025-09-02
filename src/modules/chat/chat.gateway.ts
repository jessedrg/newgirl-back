import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatService } from './chat.service';
import { SessionTrackingService } from './services/session-tracking.service';
import { ChatSession, ChatSessionDocument } from '../../schemas/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../../schemas/chat-message.schema';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { UserWallet, UserWalletDocument } from '../../schemas/user-wallet.schema';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  adminId?: string;
  userType?: 'user' | 'admin';
  sessionId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private connectedAdmins = new Map<string, AuthenticatedSocket>();
  private sessionConnections = new Map<string, { user?: AuthenticatedSocket; admin?: AuthenticatedSocket }>();
  private billingIntervals = new Map<string, NodeJS.Timeout>(); // Track billing intervals per session

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private sessionTrackingService: SessionTrackingService,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Try to decode as user token first, then admin token
      let decoded: any;
      let userType: 'user' | 'admin';
      
      try {
        console.log('🔑 ChatGateway - JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('🔑 ChatGateway - JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
        console.log('🔑 ChatGateway - Token length:', token.length);
        console.log('🔑 ChatGateway - Token preview:', token.substring(0, 50) + '...');
        
        decoded = this.jwtService.verify(token);
        console.log('✅ ChatGateway - Token verified successfully:', { userId: decoded.userId, adminId: decoded.adminId });
        userType = decoded.adminId ? 'admin' : 'user';
      } catch (error) {
        console.error('❌ ChatGateway - Token verification failed:', error.message);
        console.error('❌ ChatGateway - Token that failed:', token.substring(0, 50) + '...');
        this.logger.error('Invalid token:', error.message);
        client.disconnect();
        return;
      }

      client.userType = userType;
      
      if (userType === 'user') {
        client.userId = decoded.userId;
        this.connectedUsers.set(decoded.userId, client);
        this.logger.log(`User ${decoded.userId} connected`);
      } else {
        client.adminId = decoded.adminId;
        this.connectedAdmins.set(decoded.adminId, client);
        this.logger.log(`Admin ${decoded.adminId} connected`);
      }

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userType === 'user' && client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
      
      // Handle user disconnect - keep session active but pause billing if admin is active
      if (client.sessionId) {
        await this.handleUserDisconnect(client.sessionId, client.userId);
      }
      
    } else if (client.userType === 'admin' && client.adminId) {
      this.connectedAdmins.delete(client.adminId);
      this.logger.log(`Admin ${client.adminId} disconnected`);
      
      // Handle admin disconnect - pause billing immediately
      if (client.sessionId) {
        await this.handleAdminDisconnect(client.sessionId, client.adminId);
      }
    }

    // Clean up session connections
    if (client.sessionId) {
      const sessionConn = this.sessionConnections.get(client.sessionId);
      if (sessionConn) {
        if (client.userType === 'user') {
          sessionConn.user = undefined;
          // User disconnect ends the session completely, so clean up
          this.sessionConnections.delete(client.sessionId);
        } else if (client.userType === 'admin') {
          sessionConn.admin = undefined;
          // Admin disconnect keeps session alive for user, don't delete connection
          this.logger.log(`Admin disconnected from session ${client.sessionId}, session remains active for user`);
        }
      }
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const { sessionId } = data;
      
      // Validate ObjectId format
      if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
        this.logger.error(`Invalid sessionId format: ${sessionId}`);
        client.emit('error', { message: 'Invalid session ID format' });
        return;
      }
      
      // Validate session access
      if (client.userType === 'user') {
        // User can only join their own sessions
        const session = await this.chatService.getChatSession(client.userId, sessionId);
        if (!session) {
          client.emit('error', { message: 'Session not found or access denied' });
          return;
        }
      } else if (client.userType === 'admin') {
        // Admin can join any active session
        const session = await this.chatSessionModel.findById(sessionId);
        if (!session) {
          client.emit('error', { message: 'Session not found' });
          return;
        }
      }

      // Join session room
      client.join(sessionId);
      client.sessionId = sessionId;

      // Track session connections
      if (!this.sessionConnections.has(sessionId)) {
        this.sessionConnections.set(sessionId, {});
      }
      
      const sessionConn = this.sessionConnections.get(sessionId);
      if (client.userType === 'user') {
        sessionConn.user = client;
      } else {
        sessionConn.admin = client;
      }

      // Notify about connection
      client.to(sessionId).emit('user_joined', {
        userType: client.userType,
        userId: client.userId,
        adminId: client.adminId,
        timestamp: new Date()
      });

      // If admin joins and user is present, resume billing
      if (client.userType === 'admin' && sessionConn.user) {
        await this.resumeBilling(sessionId);
        
        // Replay undelivered user messages to admin
        await this.replayUndeliveredMessages(sessionId, client);
      }

      // If user joins and admin is present, start billing
      if (client.userType === 'user' && sessionConn.admin) {
        await this.startMinuteCounter(sessionId);
      }

      // Load and send initial message history
      // For admins, load ALL messages between user and girlfriend across all sessions
      // For users, load only current session messages
      let initialMessages;
      
      if (client.userType === 'admin') {
        // Get the session to find user and girlfriend
        const currentSession = await this.chatSessionModel.findById(sessionId);
        if (currentSession) {
          // Get all sessions between this user and girlfriend
          const allSessions = await this.chatSessionModel
            .find({ 
              userId: currentSession.userId,
              girlfriendId: currentSession.girlfriendId
            })
            .select('_id')
            .exec();

          const sessionIds = allSessions.map(s => s._id);

          // Get ALL messages between this user and girlfriend across all sessions
          initialMessages = await this.chatMessageModel
            .find({ sessionId: { $in: sessionIds } })
            .sort({ sentAt: 1 })
            .limit(100) // Load more messages for admin context
            .exec();
        } else {
          initialMessages = [];
        }
      } else {
        // For users, only load current session messages
        initialMessages = await this.chatMessageModel
          .find({ sessionId })
          .sort({ sentAt: 1 })
          .limit(50)
          .exec();
      }

      // Get user's wallet balance for admin display
      let userBalance = null;
      if (client.userType === 'admin') {
        const currentSession = await this.chatSessionModel.findById(sessionId);
        if (currentSession) {
          const userWallet = await this.userWalletModel.findOne({ userId: currentSession.userId });
          if (userWallet) {
            userBalance = {
              chatMinutes: userWallet.balance.chatMinutes,
              totalUsed: userWallet.usage.totalChatMinutesUsed
            };
          }
        }
      }

      client.emit('session_joined', { 
        sessionId, 
        timestamp: new Date(),
        initialMessages: initialMessages.map(msg => ({
          id: msg._id.toString(),
          content: msg.content,
          senderType: msg.senderType,
          timestamp: msg.sentAt,
          sentAt: msg.sentAt,
          actualSenderId: msg.actualSenderId
        })),
        userBalance // Include user balance for admin
      });
      
    } catch (error) {
      this.logger.error('Join session error:', error);
      client.emit('error', { message: 'Failed to join session' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; content?: string; messageType?: string; mediaUrl?: string }
  ) {
    try {
      const { sessionId, content, messageType = 'text', mediaUrl } = data;

      if (!client.sessionId || client.sessionId !== sessionId) {
        client.emit('error', { message: 'Not joined to this session' });
        return;
      }

      // For image/audio messages, use mediaUrl as content if content is empty
      let messageContent = content;
      if (!messageContent && (messageType === 'image' || messageType === 'audio') && mediaUrl) {
        messageContent = mediaUrl;
      }

      // Validate that we have content for the message
      if (!messageContent) {
        client.emit('error', { message: 'Message content is required' });
        return;
      }

      let message;
      const sessionConn = this.sessionConnections.get(sessionId);
      const isAdminPresent = sessionConn?.admin !== undefined;
      
      if (client.userType === 'user') {
        // User sending message
        message = await this.chatService.sendMessage(client.userId, {
          sessionId,
          content: messageContent,
          messageType
        });

        // If admin is present, mark message as delivered immediately
        if (isAdminPresent) {
          await this.chatMessageModel.findByIdAndUpdate(message._id, {
            deliveredToAdmin: true,
            deliveredToAdminAt: new Date()
          });
        }
        // If no admin present, message stays undelivered for later replay
        
      } else if (client.userType === 'admin') {
        // Admin sending message (as girlfriend)
        message = await this.sendAdminMessage(client.adminId, {
          sessionId,
          content: messageContent,
          messageType,
          senderType: 'girlfriend' // Admin impersonates girlfriend
        });

        // Admin messages are always considered "delivered" since admin sent them
        await this.chatMessageModel.findByIdAndUpdate(message._id, {
          deliveredToAdmin: true,
          deliveredToAdminAt: new Date()
        });
      }

      // Clear typing status when message is sent
      await this.updateTypingStatusWebSocket(sessionId, false, client.userType);
      
      // Broadcast typing status cleared to other session participants
      client.to(sessionId).emit('typing_status_update', {
        userType: client.userType,
        userId: client.userId,
        adminId: client.adminId,
        isTyping: false,
        timestamp: new Date()
      });

      // Broadcast message to all session participants
      this.server.to(sessionId).emit('new_message', {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        content: message.content,
        messageType: message.messageType,
        sentAt: message.sentAt,
        actualSenderId: message.actualSenderId,
        deliveredToAdmin: isAdminPresent || client.userType === 'admin'
      });

    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('end_session')
  async handleEndSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const { sessionId } = data;

      // Only users can end sessions
      if (client.userType !== 'user') {
        client.emit('error', { message: 'Only users can end chat sessions' });
        return;
      }

      if (!client.sessionId || client.sessionId !== sessionId) {
        client.emit('error', { message: 'Not joined to this session' });
        return;
      }

      // End the session
      await this.chatService.endChatSession(client.userId, sessionId);

      // Notify all participants
      this.server.to(sessionId).emit('session_ended', {
        sessionId,
        endedBy: 'user',
        timestamp: new Date()
      });

      // Remove all clients from session room
      const sessionConn = this.sessionConnections.get(sessionId);
      if (sessionConn) {
        if (sessionConn.user) {
          sessionConn.user.leave(sessionId);
          sessionConn.user.sessionId = undefined;
        }
        if (sessionConn.admin) {
          sessionConn.admin.leave(sessionId);
          sessionConn.admin.sessionId = undefined;
        }
        this.sessionConnections.delete(sessionId);
      }

    } catch (error) {
      this.logger.error('End session error:', error);
      client.emit('error', { message: 'Failed to end session' });
    }
  }

  @SubscribeMessage('typing_status')
  async handleTypingStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; isTyping: boolean }
  ) {
    try {
      const { sessionId, isTyping } = data;

      if (!client.sessionId || client.sessionId !== sessionId) {
        return;
      }

      // Update typing status in database (bypass user ownership check for WebSocket)
      await this.updateTypingStatusWebSocket(sessionId, isTyping, client.userType);

      // Broadcast typing status to other session participants
      client.to(sessionId).emit('typing_status_update', {
        userType: client.userType,
        userId: client.userId,
        adminId: client.adminId,
        isTyping,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Typing status error:', error);
    }
  }

  // Helper method to handle user disconnect
  private async handleUserDisconnect(sessionId: string, userId: string) {
    try {
      // User disconnect should END the session completely
      this.logger.log(`User ${userId} disconnected from session ${sessionId} - ending session`);
      
      // Stop the minute counter when session ends
      this.stopMinuteCounter(sessionId);
      
      // End the chat session in database
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        status: 'ended',
        endedAt: new Date(),
        endedBy: 'user_disconnect'
      });

      // Notify admin if present that session has ended
      const sessionConn = this.sessionConnections.get(sessionId);
      if (sessionConn?.admin) {
        sessionConn.admin.emit('session_ended', {
          sessionId,
          userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.logger.error('Handle user disconnect error:', error);
    }
  }

  // Helper method to handle admin disconnect - PAUSE BILLING
  private async handleAdminDisconnect(sessionId: string, adminId: string) {
    try {
      // Pause billing when admin disconnects
      await this.pauseBilling(sessionId);

      // Notify user if present
      const sessionConn = this.sessionConnections.get(sessionId);
      if (sessionConn?.user) {
        sessionConn.user.emit('admin_disconnected', {
          sessionId,
          adminId,
          billingPaused: true,
          timestamp: new Date()
        });
      }

      // Release admin from session in database
      await this.releaseAdminFromSession(adminId, sessionId);

    } catch (error) {
      this.logger.error('Handle admin disconnect error:', error);
    }
  }

  // Helper method to pause billing
  private async pauseBilling(sessionId: string) {
    try {
      // Update session to pause billing
      await this.chatService.pauseSessionBilling(sessionId);
      
      // Stop the minute counter when billing is paused
      this.stopMinuteCounter(sessionId);
      
      this.logger.log(`Billing paused for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Pause billing error:', error);
    }
  }

  // Helper method to resume billing
  private async resumeBilling(sessionId: string) {
    try {
      // Update session to resume billing
      await this.chatService.resumeSessionBilling(sessionId);
      this.logger.log(`Billing resumed for session ${sessionId}`);
      
      // Start the minute counter if both user and admin are connected
      const sessionConn = this.sessionConnections.get(sessionId);
      if (sessionConn?.user && sessionConn?.admin) {
        await this.startMinuteCounter(sessionId);
      }
    } catch (error) {
      this.logger.error('Resume billing error:', error);
    }
  }

  // Start minute counter - deduct 1 minute every 60 seconds
  private async startMinuteCounter(sessionId: string) {
    // Clear existing interval if any
    this.stopMinuteCounter(sessionId);

    const session = await this.chatSessionModel.findById(sessionId);
    if (!session || session.status !== 'active' || session.billingPaused) {
      return;
    }

    this.logger.log(`Starting minute counter for session ${sessionId}`);

    const interval = setInterval(async () => {
      try {
        this.logger.log(`[BILLING] Minute counter tick for session ${sessionId}`);
        
        // Get current session to check if still active
        const currentSession = await this.chatSessionModel.findById(sessionId);
        if (!currentSession || currentSession.status !== 'active' || currentSession.billingPaused) {
          this.logger.log(`[BILLING] Session ${sessionId} not active or paused - stopping counter`);
          this.stopMinuteCounter(sessionId);
          return;
        }

        // Check if both user and admin are still connected
        const sessionConn = this.sessionConnections.get(sessionId);
        this.logger.log(`[BILLING] Session connections for ${sessionId}:`, {
          hasUser: !!sessionConn?.user,
          hasAdmin: !!sessionConn?.admin,
          userConnected: sessionConn?.user?.connected,
          adminConnected: sessionConn?.admin?.connected
        });
        
        if (!sessionConn?.user || !sessionConn?.admin) {
          this.logger.log(`[BILLING] Missing connections for session ${sessionId} - stopping counter`);
          this.stopMinuteCounter(sessionId);
          return;
        }

        // Deduct 1 minute from user's wallet
        const wallet = await this.userWalletModel.findOne({ userId: currentSession.userId });
        this.logger.log(`[BILLING] Found wallet for user ${currentSession.userId}:`, {
          walletId: wallet?._id,
          currentMinutes: wallet?.balance?.chatMinutes,
          hasWallet: !!wallet
        });
        
        if (!wallet || wallet.balance.chatMinutes <= 0) {
          // No minutes left - end session
          this.logger.log(`[BILLING] No minutes left for session ${sessionId} - ending session`);
          await this.endSessionDueToNoMinutes(sessionId);
          this.stopMinuteCounter(sessionId);
          return;
        }

        // Deduct 1 minute
        this.logger.log(`[BILLING] Deducting 1 minute from wallet ${wallet._id}. Current: ${wallet.balance.chatMinutes}`);
        const updateResult = await this.userWalletModel.findByIdAndUpdate(wallet._id, {
          $inc: { 'balance.chatMinutes': -1, 'usage.totalChatMinutesUsed': 1 }
        });
        this.logger.log(`[BILLING] Wallet update result:`, { success: !!updateResult });

        // Notify user about updated balance
        const updatedWallet = await this.userWalletModel.findById(wallet._id);
        this.logger.log(`[BILLING] Updated wallet balance:`, {
          newMinutes: updatedWallet?.balance?.chatMinutes,
          totalUsed: updatedWallet?.usage?.totalChatMinutesUsed
        });
        
        // Notify user about updated balance
        if (sessionConn.user) {
          sessionConn.user.emit('balance_update', {
            chatMinutes: updatedWallet.balance.chatMinutes,
            timestamp: new Date()
          });
        }

        // Notify admin about user's updated balance
        if (sessionConn.admin) {
          sessionConn.admin.emit('user_balance_update', {
            chatMinutes: updatedWallet.balance.chatMinutes,
            totalUsed: updatedWallet.usage.totalChatMinutesUsed,
            timestamp: new Date()
          });
        }

        // Track admin chat minutes for dashboard analytics
        if (sessionConn.admin && sessionConn.admin.adminId) {
          await this.adminModel.findByIdAndUpdate(sessionConn.admin.adminId, {
            $inc: { 
              'stats.totalChatsHandled': 0, // Don't increment per minute, just ensure field exists
              'stats.totalHoursWorked': 1/60 // Add 1 minute (1/60 of an hour)
            }
          });
        }

        this.logger.log(`Deducted 1 minute from user ${currentSession.userId}. Remaining: ${updatedWallet.balance.chatMinutes}`);

      } catch (error) {
        this.logger.error(`Minute counter error for session ${sessionId}:`, error);
        this.stopMinuteCounter(sessionId);
      }
    }, 60000); // 60 seconds = 1 minute

    this.billingIntervals.set(sessionId, interval);
  }

  // Stop minute counter
  private stopMinuteCounter(sessionId: string) {
    const interval = this.billingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.billingIntervals.delete(sessionId);
      this.logger.log(`Stopped minute counter for session ${sessionId}`);
    }
  }

  // End session due to no minutes
  private async endSessionDueToNoMinutes(sessionId: string) {
    try {
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        status: 'ended',
        endedAt: new Date(),
        endedBy: 'no_minutes'
      });

      // Notify both user and admin
      const sessionConn = this.sessionConnections.get(sessionId);
      if (sessionConn?.user) {
        sessionConn.user.emit('session_ended', {
          sessionId,
          reason: 'no_minutes',
          message: 'Chat ended: No minutes remaining',
          timestamp: new Date()
        });
      }
      if (sessionConn?.admin) {
        sessionConn.admin.emit('session_ended', {
          sessionId,
          reason: 'no_minutes',
          message: 'Chat ended: User has no minutes remaining',
          timestamp: new Date()
        });
      }

      this.logger.log(`Session ${sessionId} ended due to no minutes`);
    } catch (error) {
      this.logger.error('End session due to no minutes error:', error);
    }
  }

  // Helper method to send admin message
  private async sendAdminMessage(adminId: string, messageData: any) {
    const { sessionId, content, messageType = 'text', senderType = 'girlfriend' } = messageData;

    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
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

  // Helper method to release admin from session
  private async releaseAdminFromSession(adminId: string, sessionId: string) {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      return;
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
  }

  // Helper method to handle billing for first admin message
  private async handleBillingForFirstMessage(userId: string) {
    // Deduct 1 minute from user's wallet
    await this.userWalletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { chatMinutes: -1 } }
    );
  }

  // Helper method to update typing status for WebSocket (bypasses user ownership check)
  private async updateTypingStatusWebSocket(sessionId: string, isTyping: boolean, userType: 'user' | 'admin') {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      return; // Session not found, ignore typing status
    }

    // Update typing status based on user type
    const updateField = userType === 'user' ? 'isUserTyping' : 'isAdminTyping';
    
    await this.chatSessionModel.findByIdAndUpdate(sessionId, {
      $set: { 
        [updateField]: isTyping,
        lastActivity: new Date()
      }
    });
  }

  // Helper method to replay undelivered messages to admin when they join
  private async replayUndeliveredMessages(sessionId: string, adminClient: AuthenticatedSocket) {
    try {
      // Get all user messages that haven't been delivered to admin yet
      const undeliveredMessages = await this.chatMessageModel
        .find({
          sessionId: new Types.ObjectId(sessionId),
          senderType: 'user',
          deliveredToAdmin: false
        })
        .sort({ sentAt: 1 }) // Chronological order
        .exec();

      if (undeliveredMessages.length === 0) {
        return; // No messages to replay
      }

      this.logger.log(`Replaying ${undeliveredMessages.length} undelivered messages to admin for session ${sessionId}`);

      // Send each message to admin via WebSocket
      for (const message of undeliveredMessages) {
        adminClient.emit('new_message', {
          id: message._id.toString(),
          senderId: message.senderId.toString(),
          senderType: message.senderType,
          content: message.content,
          messageType: message.messageType,
          sentAt: message.sentAt,
          isRead: message.isRead,
          isReplayed: true // Flag to indicate this is a replayed message
        });

        // Mark message as delivered to admin
        await this.chatMessageModel.findByIdAndUpdate(message._id, {
          deliveredToAdmin: true,
          deliveredToAdminAt: new Date()
        });
      }

      // Notify admin about message replay completion
      adminClient.emit('message_replay_complete', {
        sessionId,
        replayedCount: undeliveredMessages.length,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Message replay error:', error);
    }
  }
}
