import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionTrackingService } from '../services/session-tracking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('session-tracking')
@Controller('session-tracking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionTrackingController {
  constructor(private readonly trackingService: SessionTrackingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start tracking a chat session' })
  @ApiResponse({ status: 201, description: 'Tracking started successfully' })
  async startTracking(@Body() body: {
    sessionId: string;
    userId: string;
    adminId: string;
  }) {
    const tracking = await this.trackingService.startTracking(
      body.sessionId,
      body.userId,
      body.adminId
    );
    
    return {
      success: true,
      trackingId: tracking._id,
      startTime: tracking.startTime,
      message: 'Session tracking started'
    };
  }

  @Put(':sessionId/end')
  @ApiOperation({ summary: 'End tracking for a session' })
  @ApiResponse({ status: 200, description: 'Tracking ended successfully' })
  async endTracking(
    @Param('sessionId') sessionId: string,
    @Body() body: { reason?: string }
  ) {
    await this.trackingService.endTracking(sessionId, body.reason);
    
    return {
      success: true,
      message: 'Session tracking ended'
    };
  }

  @Put(':sessionId/pause')
  @ApiOperation({ summary: 'Pause tracking for a session' })
  @ApiResponse({ status: 200, description: 'Tracking paused successfully' })
  async pauseTracking(
    @Param('sessionId') sessionId: string,
    @Body() body: { reason: string }
  ) {
    await this.trackingService.pauseTracking(sessionId, body.reason);
    
    return {
      success: true,
      message: 'Session tracking paused'
    };
  }

  @Put(':sessionId/resume')
  @ApiOperation({ summary: 'Resume tracking for a session' })
  @ApiResponse({ status: 200, description: 'Tracking resumed successfully' })
  async resumeTracking(@Param('sessionId') sessionId: string) {
    await this.trackingService.resumeTracking(sessionId);
    
    return {
      success: true,
      message: 'Session tracking resumed'
    };
  }

  @Post(':sessionId/ping')
  @ApiOperation({ summary: 'Update activity ping for a session' })
  @ApiResponse({ status: 200, description: 'Ping updated successfully' })
  async updatePing(@Param('sessionId') sessionId: string) {
    await this.trackingService.updatePing(sessionId);
    
    return {
      success: true,
      message: 'Activity ping updated'
    };
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get current session tracking info' })
  @ApiResponse({ status: 200, description: 'Session tracking info retrieved' })
  async getSessionTracking(@Param('sessionId') sessionId: string) {
    const tracking = await this.trackingService.getSessionTracking(sessionId);
    
    if (!tracking) {
      return {
        success: false,
        message: 'No active tracking found for this session'
      };
    }

    const currentMinutes = tracking.minutesTracked;
    const currentSeconds = tracking.secondsTracked;
    const isActive = tracking.status === 'active';
    const isPaused = tracking.status === 'paused';

    return {
      success: true,
      tracking: {
        id: tracking._id,
        sessionId: tracking.sessionId,
        userId: tracking.userId,
        adminId: tracking.adminId,
        startTime: tracking.startTime,
        endTime: tracking.endTime,
        minutesTracked: currentMinutes,
        secondsTracked: currentSeconds,
        status: tracking.status,
        isActive,
        isPaused,
        billingActive: tracking.billingActive,
        pauseReason: tracking.pauseReason,
        pausedAt: tracking.pausedAt,
        pausedDuration: tracking.pausedDuration,
        lastPing: tracking.lastPing
      }
    };
  }

  @Get('admin/:adminId/daily')
  @ApiOperation({ summary: 'Get admin daily statistics' })
  @ApiResponse({ status: 200, description: 'Admin daily stats retrieved' })
  async getAdminDailyStats(
    @Param('adminId') adminId: string,
    @Query('date') dateStr?: string
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const stats = await this.trackingService.getAdminDailyStats(adminId, date);
    
    if (!stats) {
      return {
        success: true,
        stats: {
          adminId,
          date,
          totalMinutes: 0,
          totalSessions: 0,
          activeMinutes: 0,
          pausedMinutes: 0,
          averageSessionLength: 0,
          uniqueUsers: 0,
          hourlyBreakdown: {}
        }
      };
    }

    return {
      success: true,
      stats: {
        adminId: stats.adminId,
        date: stats.date,
        totalMinutes: stats.totalMinutes,
        totalSessions: stats.totalSessions,
        activeMinutes: stats.activeMinutes,
        pausedMinutes: stats.pausedMinutes,
        averageSessionLength: stats.averageSessionLength,
        uniqueUsers: stats.uniqueUsers,
        firstSessionStart: stats.firstSessionStart,
        lastSessionEnd: stats.lastSessionEnd,
        hourlyBreakdown: Object.fromEntries(stats.hourlyBreakdown)
      }
    };
  }

  @Get('admin/:adminId/range')
  @ApiOperation({ summary: 'Get admin statistics for date range' })
  @ApiResponse({ status: 200, description: 'Admin range stats retrieved' })
  async getAdminStatsRange(
    @Param('adminId') adminId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    const stats = await this.trackingService.getAdminStatsRange(adminId, startDate, endDate);
    
    const totalMinutes = stats.reduce((sum, stat) => sum + stat.totalMinutes, 0);
    const totalSessions = stats.reduce((sum, stat) => sum + stat.totalSessions, 0);
    const totalUniqueUsers = new Set(stats.flatMap(stat => stat.userIds.map(id => id.toString()))).size;

    return {
      success: true,
      summary: {
        totalMinutes,
        totalSessions,
        totalUniqueUsers,
        averageMinutesPerDay: Math.round(totalMinutes / Math.max(stats.length, 1)),
        daysActive: stats.length
      },
      dailyStats: stats.map(stat => ({
        date: stat.date,
        totalMinutes: stat.totalMinutes,
        totalSessions: stat.totalSessions,
        activeMinutes: stat.activeMinutes,
        pausedMinutes: stat.pausedMinutes,
        averageSessionLength: stat.averageSessionLength,
        uniqueUsers: stat.uniqueUsers,
        hourlyBreakdown: Object.fromEntries(stat.hourlyBreakdown)
      }))
    };
  }

  @Get('leaderboard/daily')
  @ApiOperation({ summary: 'Get daily admin leaderboard' })
  @ApiResponse({ status: 200, description: 'Daily leaderboard retrieved' })
  async getDailyLeaderboard(@Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const stats = await this.trackingService.getAllAdminStats(date);
    
    return {
      success: true,
      date,
      leaderboard: stats.map((stat, index) => ({
        rank: index + 1,
        adminId: stat.adminId,
        totalMinutes: stat.totalMinutes,
        totalSessions: stat.totalSessions,
        activeMinutes: stat.activeMinutes,
        averageSessionLength: stat.averageSessionLength,
        uniqueUsers: stat.uniqueUsers,
        efficiency: stat.totalMinutes > 0 ? Math.round((stat.activeMinutes / stat.totalMinutes) * 100) : 0
      }))
    };
  }
}
