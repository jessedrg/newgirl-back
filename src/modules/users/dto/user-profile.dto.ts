import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDate, IsNumber, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserBalanceDto {
  @ApiProperty({ description: 'Available chat minutes', example: 120 })
  @IsNumber()
  chatMinutes: number;

  @ApiProperty({ description: 'Available image generation credits', example: 50 })
  @IsNumber()
  imageCredits: number;

  @ApiProperty({ description: 'Available tip credits', example: 25 })
  @IsNumber()
  tipCredits: number;
}

export class UserUsageDto {
  @ApiProperty({ description: 'Total chat minutes used', example: 480 })
  @IsNumber()
  totalChatMinutesUsed: number;

  @ApiProperty({ description: 'Total images generated', example: 125 })
  @IsNumber()
  totalImagesGenerated: number;

  @ApiProperty({ description: 'Total tips given', example: 15 })
  @IsNumber()
  totalTipsGiven: number;

  @ApiProperty({ description: 'Total amount spent in cents', example: 2500 })
  @IsNumber()
  totalSpent: number;

  @ApiProperty({ description: 'Total amount spent in USD', example: 25.00 })
  @IsNumber()
  totalSpentUSD: number;
}

export class UserSubscriptionDto {
  @ApiProperty({ description: 'Whether user has active subscription', example: true })
  @IsBoolean()
  hasActiveSubscription: boolean;

  @ApiProperty({ description: 'Subscription expiration date', example: '2024-02-15T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDate()
  subscriptionExpiresAt?: Date;

  @ApiProperty({ description: 'Days until subscription expires', example: 15, required: false })
  @IsOptional()
  @IsNumber()
  daysUntilExpiry?: number;

  @ApiProperty({ description: 'Subscription status', example: 'active', enum: ['active', 'expired', 'none'] })
  @IsString()
  status: 'active' | 'expired' | 'none';
}

export class CreditsReceivedDto {
  @ApiProperty({ description: 'Chat minutes received', example: 60 })
  @IsNumber()
  chatMinutes: number;

  @ApiProperty({ description: 'Image credits received', example: 20 })
  @IsNumber()
  imageCredits: number;

  @ApiProperty({ description: 'Tip credits received', example: 10 })
  @IsNumber()
  tipCredits: number;
}

export class RecentTransactionDto {
  @ApiProperty({ description: 'Transaction ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Transaction type', example: 'chat_minutes' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Amount in cents', example: 1000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Amount in USD', example: 10.00 })
  @IsNumber()
  amountUSD: number;

  @ApiProperty({ description: 'Transaction status', example: 'completed' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Payment provider', example: 'confirmo' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Transaction date', example: '2024-01-15T10:30:00.000Z' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Payment plan name', example: 'Basic Plan', required: false })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiProperty({ description: 'Credits received from this transaction', type: CreditsReceivedDto })
  @ValidateNested()
  @Type(() => CreditsReceivedDto)
  creditsReceived: CreditsReceivedDto;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of transactions', example: 12 })
  @IsNumber()
  totalTransactions: number;

  @ApiProperty({ description: 'Member since date', example: 'January 2024' })
  @IsString()
  memberSince: string;

  @ApiProperty({ description: 'Most used payment method', example: 'confirmo' })
  @IsString()
  favoritePaymentMethod: string;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Account creation date', example: '2024-01-01T00:00:00.000Z' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last activity date', example: '2024-01-15T14:30:00.000Z' })
  @IsDate()
  lastActivity: Date;

  @ApiProperty({ description: 'User wallet balance', type: UserBalanceDto })
  @ValidateNested()
  @Type(() => UserBalanceDto)
  balance: UserBalanceDto;

  @ApiProperty({ description: 'User usage statistics', type: UserUsageDto })
  @ValidateNested()
  @Type(() => UserUsageDto)
  usage: UserUsageDto;

  @ApiProperty({ description: 'User subscription information', type: UserSubscriptionDto })
  @ValidateNested()
  @Type(() => UserSubscriptionDto)
  subscription: UserSubscriptionDto;

  @ApiProperty({ description: 'Recent transactions (last 10)', type: [RecentTransactionDto] })
  @ValidateNested({ each: true })
  @Type(() => RecentTransactionDto)
  recentTransactions: RecentTransactionDto[];

  @ApiProperty({ description: 'User account statistics', type: UserStatsDto })
  @ValidateNested()
  @Type(() => UserStatsDto)
  stats: UserStatsDto;
}
