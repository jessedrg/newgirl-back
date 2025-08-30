import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserBalanceDto {
  @ApiProperty({ description: 'Available chat minutes', example: 60 })
  chatMinutes: number;

  @ApiProperty({ description: 'Available image credits', example: 10 })
  imageCredits: number;

  @ApiProperty({ description: 'Available tip credits', example: 5 })
  tipCredits: number;
}

export class UserUsageStatsDto {
  @ApiProperty({ description: 'Total chat minutes used', example: 45 })
  totalChatMinutesUsed: number;

  @ApiProperty({ description: 'Total images generated', example: 3 })
  totalImagesGenerated: number;

  @ApiProperty({ description: 'Total tips given', example: 2 })
  totalTipsGiven: number;

  @ApiProperty({ description: 'Total amount spent in cents', example: 1999 })
  totalSpent: number;

  @ApiProperty({ description: 'Total amount spent in dollars', example: 19.99 })
  totalSpentUSD: number;
}

export class UserSubscriptionDto {
  @ApiProperty({ description: 'Has active subscription', example: false })
  hasActiveSubscription: boolean;

  @ApiPropertyOptional({ description: 'Subscription expiration date' })
  subscriptionExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Days until subscription expires', example: 15 })
  daysUntilExpiry?: number;

  @ApiProperty({ description: 'Subscription status', example: 'active' })
  status: 'active' | 'expired' | 'none';
}

export class RecentTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction type', example: 'chat_minutes' })
  type: string;

  @ApiProperty({ description: 'Amount in cents', example: 999 })
  amount: number;

  @ApiProperty({ description: 'Amount in USD', example: 9.99 })
  amountUSD: number;

  @ApiProperty({ description: 'Transaction status', example: 'completed' })
  status: string;

  @ApiProperty({ description: 'Payment provider', example: 'confirmo' })
  provider: string;

  @ApiProperty({ description: 'Transaction date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Plan name if applicable', example: 'Popular Pack' })
  planName?: string;

  @ApiProperty({ description: 'Credits received' })
  creditsReceived: {
    chatMinutes: number;
    imageCredits: number;
    tipCredits: number;
  };
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User display name' })
  name: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActivity: Date;

  @ApiProperty({ description: 'Current wallet balance', type: UserBalanceDto })
  balance: UserBalanceDto;

  @ApiProperty({ description: 'Usage statistics', type: UserUsageStatsDto })
  usage: UserUsageStatsDto;

  @ApiProperty({ description: 'Subscription information', type: UserSubscriptionDto })
  subscription: UserSubscriptionDto;

  @ApiProperty({ description: 'Recent transactions', type: [RecentTransactionDto] })
  recentTransactions: RecentTransactionDto[];

  @ApiProperty({ description: 'Account statistics' })
  stats: {
    totalTransactions: number;
    memberSince: string;
    favoritePaymentMethod: string;
  };
}
