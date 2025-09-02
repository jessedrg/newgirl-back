import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSessionTracking, ChatSessionTrackingDocument } from '../../../schemas/chat-session-tracking.schema';
import { AdminSessionStats, AdminSessionStatsDocument } from '../../../schemas/admin-session-stats.schema';
import { ChatSession, ChatSessionDocument } from '../../../schemas/chat-session.schema';

@Injectable()
export class SessionTrackingService {
  private readonly logger = new Logger(SessionTrackingService.name);
  private activeTrackers = new Map<string, NodeJS.Timeout>(); // sessionId -> timer

  constructor(
    @InjectModel(ChatSessionTracking.name) 
    private trackingModel: Model<ChatSessionTrackingDocument>,
    @InjectModel(AdminSessionStats.name) 
    private statsModel: Model<AdminSessionStatsDocument>,
    @InjectModel(ChatSession.name) 
    private sessionModel: Model<ChatSessionDocument>,
  ) {}

  /**
   * Start tracking a chat session between user and admin
   */
  async startTracking(
    sessionId: string, 
    userId: string, 
    adminId: string
  ): Promise<ChatSessionTrackingDocument> {
    this.logger.log(`Starting tracking for session ${sessionId}, admin ${adminId}`);

    // Create new tracking record
    const tracking = new this.trackingModel({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      adminId: new Types.ObjectId(adminId),
      startTime: new Date(),
      status: 'active',
      billingActive: true,
      lastPing: new Date()
    });

    const savedTracking = await tracking.save();

    // Start real-time minute counter
    this.startMinuteCounter(sessionId);

    // Update chat session
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      adminId: new Types.ObjectId(adminId),
      isAdminActive: true,
      billingStarted: true,
      lastActivity: new Date()
    });

    return savedTracking;
  }

  /**
   * End tracking for a session
   */
  async endTracking(sessionId: string, reason?: string): Promise<void> {
    this.logger.log(`Ending tracking for session ${sessionId}`);

    const tracking = await this.trackingModel.findOne({
      sessionId: new Types.ObjectId(sessionId),
      status: 'active'
    });

    if (!tracking) {
      this.logger.warn(`No active tracking found for session ${sessionId}`);
      return;
    }

    const endTime = new Date();
    const totalSeconds = Math.floor((endTime.getTime() - tracking.startTime.getTime()) / 1000);
    const totalMinutes = Math.ceil(totalSeconds / 60);

    // Update tracking record
    tracking.endTime = endTime;
    tracking.status = 'ended';
    tracking.secondsTracked = totalSeconds - tracking.pausedDuration;
    tracking.minutesTracked = Math.ceil(tracking.secondsTracked / 60);
    await tracking.save();

    // Stop real-time counter
    this.stopMinuteCounter(sessionId);

    // Update daily stats
    await this.updateDailyStats(tracking.adminId.toString(), tracking);

    // Update chat session
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      isAdminActive: false,
      endedAt: endTime,
      status: 'ended',
      minutesUsed: totalMinutes
    });

    this.logger.log(`Tracking ended for session ${sessionId}: ${tracking.minutesTracked} minutes`);
  }

  /**
   * Pause tracking (admin goes away, user inactive, etc.)
   */
  async pauseTracking(sessionId: string, reason: string): Promise<void> {
    const tracking = await this.trackingModel.findOne({
      sessionId: new Types.ObjectId(sessionId),
      status: 'active'
    });

    if (!tracking) return;

    tracking.status = 'paused';
    tracking.pauseReason = reason;
    tracking.pausedAt = new Date();
    await tracking.save();

    // Stop minute counter
    this.stopMinuteCounter(sessionId);

    // Update chat session
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      billingPaused: true,
      billingPausedAt: new Date()
    });

    this.logger.log(`Tracking paused for session ${sessionId}: ${reason}`);
  }

  /**
   * Resume tracking
   */
  async resumeTracking(sessionId: string): Promise<void> {
    const tracking = await this.trackingModel.findOne({
      sessionId: new Types.ObjectId(sessionId),
      status: 'paused'
    });

    if (!tracking) return;

    const now = new Date();
    const pausedDuration = tracking.pausedAt ? 
      Math.floor((now.getTime() - tracking.pausedAt.getTime()) / 1000) : 0;

    tracking.status = 'active';
    tracking.resumedAt = now;
    tracking.pausedDuration += pausedDuration;
    tracking.pauseReason = null;
    tracking.pausedAt = null;
    await tracking.save();

    // Restart minute counter
    this.startMinuteCounter(sessionId);

    // Update chat session
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      billingPaused: false,
      billingPausedAt: null,
      lastActivity: now
    });

    this.logger.log(`Tracking resumed for session ${sessionId}`);
  }

  /**
   * Update activity ping (called every 30 seconds from frontend)
   */
  async updatePing(sessionId: string): Promise<void> {
    await this.trackingModel.findOneAndUpdate(
      { 
        sessionId: new Types.ObjectId(sessionId), 
        status: 'active' 
      },
      { 
        lastPing: new Date() 
      }
    );
  }

  /**
   * Get current session tracking info
   */
  async getSessionTracking(sessionId: string): Promise<ChatSessionTrackingDocument | null> {
    return this.trackingModel.findOne({
      sessionId: new Types.ObjectId(sessionId),
      status: { $in: ['active', 'paused'] }
    }).populate('userId adminId');
  }

  /**
   * Get admin daily statistics
   */
  async getAdminDailyStats(adminId: string, date: Date): Promise<AdminSessionStatsDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return this.statsModel.findOne({
      adminId: new Types.ObjectId(adminId),
      date: startOfDay
    });
  }

  /**
   * Get admin statistics for date range
   */
  async getAdminStatsRange(
    adminId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AdminSessionStatsDocument[]> {
    return this.statsModel.find({
      adminId: new Types.ObjectId(adminId),
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
  }

  /**
   * Get all admin statistics (leaderboard)
   */
  async getAllAdminStats(date: Date): Promise<AdminSessionStatsDocument[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return this.statsModel.find({
      date: startOfDay
    }).populate('adminId').sort({ totalMinutes: -1 });
  }

  /**
   * Start real-time minute counter for a session
   */
  private startMinuteCounter(sessionId: string): void {
    // Clear existing timer if any
    this.stopMinuteCounter(sessionId);

    // Update every minute
    const timer = setInterval(async () => {
      try {
        const tracking = await this.trackingModel.findOne({
          sessionId: new Types.ObjectId(sessionId),
          status: 'active'
        });

        if (!tracking) {
          this.stopMinuteCounter(sessionId);
          return;
        }

        // Check if session is still active (last ping within 2 minutes)
        const lastPingAge = Date.now() - tracking.lastPing.getTime();
        if (lastPingAge > 2 * 60 * 1000) { // 2 minutes
          await this.pauseTracking(sessionId, 'inactive');
          return;
        }

        // Update current minutes
        const currentSeconds = Math.floor((Date.now() - tracking.startTime.getTime()) / 1000);
        const currentMinutes = Math.ceil((currentSeconds - tracking.pausedDuration) / 60);

        await this.trackingModel.findByIdAndUpdate(tracking._id, {
          secondsTracked: currentSeconds - tracking.pausedDuration,
          minutesTracked: currentMinutes
        });

        // Update chat session minutes
        await this.sessionModel.findByIdAndUpdate(sessionId, {
          minutesUsed: currentMinutes,
          lastActivity: new Date()
        });

      } catch (error) {
        this.logger.error(`Error updating minute counter for session ${sessionId}:`, error);
      }
    }, 60000); // Every minute

    this.activeTrackers.set(sessionId, timer);
  }

  /**
   * Stop minute counter for a session
   */
  private stopMinuteCounter(sessionId: string): void {
    const timer = this.activeTrackers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.activeTrackers.delete(sessionId);
    }
  }

  /**
   * Update daily statistics for an admin
   */
  private async updateDailyStats(
    adminId: string, 
    tracking: ChatSessionTrackingDocument
  ): Promise<void> {
    const date = new Date(tracking.startTime);
    date.setHours(0, 0, 0, 0);

    let stats = await this.statsModel.findOne({
      adminId: new Types.ObjectId(adminId),
      date
    });

    if (!stats) {
      stats = new this.statsModel({
        adminId: new Types.ObjectId(adminId),
        date,
        totalMinutes: 0,
        totalSessions: 0,
        activeMinutes: 0,
        pausedMinutes: 0,
        sessionIds: [],
        userIds: [],
        hourlyBreakdown: new Map()
      });
    }

    // Update statistics
    stats.totalMinutes += tracking.minutesTracked;
    stats.totalSessions += 1;
    stats.activeMinutes += tracking.minutesTracked;
    stats.pausedMinutes += Math.ceil(tracking.pausedDuration / 60);
    stats.sessionIds.push(tracking.sessionId);
    
    if (!stats.userIds.includes(tracking.userId)) {
      stats.userIds.push(tracking.userId);
    }
    stats.uniqueUsers = stats.userIds.length;

    // Update hourly breakdown
    const hour = tracking.startTime.getHours().toString();
    const currentHourMinutes = stats.hourlyBreakdown.get(hour) || 0;
    stats.hourlyBreakdown.set(hour, currentHourMinutes + tracking.minutesTracked);

    // Update session timing
    if (!stats.firstSessionStart || tracking.startTime < stats.firstSessionStart) {
      stats.firstSessionStart = tracking.startTime;
    }
    if (!stats.lastSessionEnd || tracking.endTime > stats.lastSessionEnd) {
      stats.lastSessionEnd = tracking.endTime;
    }

    // Calculate average session length
    stats.averageSessionLength = Math.round(stats.totalMinutes / stats.totalSessions);

    await stats.save();
  }

  /**
   * Cleanup inactive sessions (run periodically)
   */
  async cleanupInactiveSessions(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    const inactiveSessions = await this.trackingModel.find({
      status: 'active',
      lastPing: { $lt: cutoffTime }
    });

    for (const session of inactiveSessions) {
      await this.pauseTracking(session.sessionId.toString(), 'auto_inactive');
    }

    this.logger.log(`Cleaned up ${inactiveSessions.length} inactive sessions`);
  }
}
