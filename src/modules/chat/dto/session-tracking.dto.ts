import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartTrackingDto {
  @ApiProperty({ example: '64f8b2c4e1234567890abcde' })
  @IsString()
  sessionId: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abcdf' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abce0' })
  @IsString()
  adminId: string;
}

export class EndTrackingDto {
  @ApiProperty({ example: 'session_completed', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PauseTrackingDto {
  @ApiProperty({ example: 'admin_away' })
  @IsString()
  reason: string;
}

export class SessionTrackingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '64f8b2c4e1234567890abce1' })
  trackingId?: string;

  @ApiProperty()
  startTime?: Date;

  @ApiProperty({ example: 'Session tracking started' })
  message: string;
}

export class SessionTrackingStatusDto {
  @ApiProperty({ example: '64f8b2c4e1234567890abce1' })
  id: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abcde' })
  sessionId: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abcdf' })
  userId: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abce0' })
  adminId: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty({ required: false })
  endTime?: Date;

  @ApiProperty({ example: 15 })
  minutesTracked: number;

  @ApiProperty({ example: 900 })
  secondsTracked: number;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isPaused: boolean;

  @ApiProperty({ example: true })
  billingActive: boolean;

  @ApiProperty({ example: null, required: false })
  pauseReason?: string;

  @ApiProperty({ required: false })
  pausedAt?: Date;

  @ApiProperty({ example: 0 })
  pausedDuration: number;

  @ApiProperty()
  lastPing: Date;
}

export class AdminDailyStatsDto {
  @ApiProperty({ example: '64f8b2c4e1234567890abce0' })
  adminId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ example: 480 })
  totalMinutes: number;

  @ApiProperty({ example: 12 })
  totalSessions: number;

  @ApiProperty({ example: 450 })
  activeMinutes: number;

  @ApiProperty({ example: 30 })
  pausedMinutes: number;

  @ApiProperty({ example: 40 })
  averageSessionLength: number;

  @ApiProperty({ example: 8 })
  uniqueUsers: number;

  @ApiProperty({ required: false })
  firstSessionStart?: Date;

  @ApiProperty({ required: false })
  lastSessionEnd?: Date;

  @ApiProperty({ 
    example: { '9': 60, '10': 120, '11': 90 },
    description: 'Minutes worked per hour (0-23)'
  })
  hourlyBreakdown: Record<string, number>;
}

export class AdminStatsRangeDto {
  @ApiProperty({ example: 2400 })
  totalMinutes: number;

  @ApiProperty({ example: 60 })
  totalSessions: number;

  @ApiProperty({ example: 25 })
  totalUniqueUsers: number;

  @ApiProperty({ example: 480 })
  averageMinutesPerDay: number;

  @ApiProperty({ example: 5 })
  daysActive: number;

  @ApiProperty({ type: [AdminDailyStatsDto] })
  dailyStats: AdminDailyStatsDto[];
}

export class LeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: '64f8b2c4e1234567890abce0' })
  adminId: string;

  @ApiProperty({ example: 480 })
  totalMinutes: number;

  @ApiProperty({ example: 12 })
  totalSessions: number;

  @ApiProperty({ example: 450 })
  activeMinutes: number;

  @ApiProperty({ example: 40 })
  averageSessionLength: number;

  @ApiProperty({ example: 8 })
  uniqueUsers: number;

  @ApiProperty({ example: 94, description: 'Efficiency percentage (active/total minutes)' })
  efficiency: number;
}

export class DailyLeaderboardDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  date: Date;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  leaderboard: LeaderboardEntryDto[];
}
