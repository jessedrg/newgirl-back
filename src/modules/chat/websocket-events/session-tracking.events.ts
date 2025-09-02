import { 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  WebSocketServer 
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SessionTrackingService } from '../services/session-tracking.service';

interface AuthenticatedSocket {
  userId?: string;
  adminId?: string;
  userType?: 'user' | 'admin';
  sessionId?: string;
  emit: (event: string, data: any) => void;
  to: (room: string) => any;
}

export class SessionTrackingEvents {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionTrackingEvents.name);

  constructor(private sessionTrackingService: SessionTrackingService) {}

  /**
   * Admin joins a chat session - start tracking
   */
  @SubscribeMessage('admin_join_session')
  async handleAdminJoinSession(
    @MessageBody() data: { sessionId: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (client.userType !== 'admin' || !client.adminId) {
        client.emit('error', { message: 'Only admins can join sessions' });
        return;
      }

      const { sessionId, userId } = data;
      
      // Start tracking
      await this.sessionTrackingService.startTracking(
        sessionId,
        userId,
        client.adminId
      );

      // Join session room
      client.sessionId = sessionId;
      
      // Notify both user and admin
      this.server.to(`session_${sessionId}`).emit('admin_joined', {
        adminId: client.adminId,
        sessionId,
        trackingStarted: true,
        timestamp: new Date()
      });

      // Start sending minute updates
      this.startMinuteUpdates(sessionId);

      this.logger.log(`Admin ${client.adminId} joined session ${sessionId}, tracking started`);

    } catch (error) {
      this.logger.error('Error handling admin join session:', error);
      client.emit('error', { message: 'Failed to join session' });
    }
  }

  /**
   * Admin leaves a chat session - end tracking
   */
  @SubscribeMessage('admin_leave_session')
  async handleAdminLeaveSession(
    @MessageBody() data: { sessionId: string; reason?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (client.userType !== 'admin') {
        return;
      }

      const { sessionId, reason } = data;
      
      // End tracking
      await this.sessionTrackingService.endTracking(sessionId, reason);

      // Notify session participants
      this.server.to(`session_${sessionId}`).emit('admin_left', {
        adminId: client.adminId,
        sessionId,
        trackingEnded: true,
        reason,
        timestamp: new Date()
      });

      // Stop minute updates
      this.stopMinuteUpdates(sessionId);

      this.logger.log(`Admin ${client.adminId} left session ${sessionId}, tracking ended`);

    } catch (error) {
      this.logger.error('Error handling admin leave session:', error);
    }
  }

  /**
   * Pause session tracking (admin goes away temporarily)
   */
  @SubscribeMessage('pause_session_tracking')
  async handlePauseTracking(
    @MessageBody() data: { sessionId: string; reason: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (client.userType !== 'admin') {
        client.emit('error', { message: 'Only admins can pause tracking' });
        return;
      }

      const { sessionId, reason } = data;
      
      await this.sessionTrackingService.pauseTracking(sessionId, reason);

      // Notify session participants
      this.server.to(`session_${sessionId}`).emit('tracking_paused', {
        sessionId,
        reason,
        timestamp: new Date()
      });

      this.logger.log(`Session ${sessionId} tracking paused: ${reason}`);

    } catch (error) {
      this.logger.error('Error pausing session tracking:', error);
      client.emit('error', { message: 'Failed to pause tracking' });
    }
  }

  /**
   * Resume session tracking
   */
  @SubscribeMessage('resume_session_tracking')
  async handleResumeTracking(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (client.userType !== 'admin') {
        client.emit('error', { message: 'Only admins can resume tracking' });
        return;
      }

      const { sessionId } = data;
      
      await this.sessionTrackingService.resumeTracking(sessionId);

      // Notify session participants
      this.server.to(`session_${sessionId}`).emit('tracking_resumed', {
        sessionId,
        timestamp: new Date()
      });

      // Restart minute updates
      this.startMinuteUpdates(sessionId);

      this.logger.log(`Session ${sessionId} tracking resumed`);

    } catch (error) {
      this.logger.error('Error resuming session tracking:', error);
      client.emit('error', { message: 'Failed to resume tracking' });
    }
  }

  /**
   * Activity ping to keep session active
   */
  @SubscribeMessage('session_ping')
  async handleSessionPing(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { sessionId } = data;
      
      await this.sessionTrackingService.updatePing(sessionId);

      // Send pong back to confirm
      client.emit('session_pong', {
        sessionId,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error handling session ping:', error);
    }
  }

  /**
   * Get current session tracking status
   */
  @SubscribeMessage('get_session_tracking')
  async handleGetSessionTracking(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { sessionId } = data;
      
      const tracking = await this.sessionTrackingService.getSessionTracking(sessionId);

      client.emit('session_tracking_status', {
        sessionId,
        tracking: tracking ? {
          minutesTracked: tracking.minutesTracked,
          secondsTracked: tracking.secondsTracked,
          status: tracking.status,
          startTime: tracking.startTime,
          billingActive: tracking.billingActive,
          pauseReason: tracking.pauseReason,
          lastPing: tracking.lastPing
        } : null,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error getting session tracking:', error);
      client.emit('error', { message: 'Failed to get tracking status' });
    }
  }

  /**
   * Start sending minute updates for a session
   */
  private startMinuteUpdates(sessionId: string) {
    // Send updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const tracking = await this.sessionTrackingService.getSessionTracking(sessionId);
        
        if (!tracking || tracking.status !== 'active') {
          clearInterval(interval);
          return;
        }

        // Send minute update to session participants
        this.server.to(`session_${sessionId}`).emit('minute_update', {
          sessionId,
          minutesTracked: tracking.minutesTracked,
          secondsTracked: tracking.secondsTracked,
          status: tracking.status,
          billingActive: tracking.billingActive,
          timestamp: new Date()
        });

      } catch (error) {
        this.logger.error(`Error sending minute update for session ${sessionId}:`, error);
      }
    }, 30000); // Every 30 seconds

    // Store interval for cleanup
    this.minuteUpdateIntervals.set(sessionId, interval);
  }

  /**
   * Stop sending minute updates for a session
   */
  private stopMinuteUpdates(sessionId: string) {
    const interval = this.minuteUpdateIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.minuteUpdateIntervals.delete(sessionId);
    }
  }

  private minuteUpdateIntervals = new Map<string, NodeJS.Timeout>();
}
