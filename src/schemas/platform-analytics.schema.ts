import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// User metrics subdocument
@Schema({ _id: false })
export class UserMetrics {
  @Prop({ default: 0 })
  totalRegistered: number;

  @Prop({ default: 0 })
  totalActive: number;

  @Prop({ default: 0 })
  newSignups: number;

  @Prop({ default: 0 })
  dailyActive: number;

  @Prop({ default: 0 })
  weeklyActive: number;

  @Prop({ default: 0 })
  monthlyActive: number;

  @Prop({ default: 0 })
  churnRate: number;

  @Prop({ default: 0 })
  averageSessionTime: number;

  @Prop({ default: 0 })
  returningUsers: number;

  @Prop({ default: 0 })
  newUsers: number;
}

// Usage metrics subdocument
@Schema({ _id: false })
export class UsageMetrics {
  @Prop({ default: 0 })
  totalMessages: number;

  @Prop({ default: 0 })
  totalChatMinutes: number;

  @Prop({ default: 0 })
  totalImagesGenerated: number;

  @Prop({ default: 0 })
  averageSessionTime: number;

  @Prop({ default: 0 })
  totalSessions: number;

  @Prop({ default: 0 })
  totalConversations: number;

  @Prop({ default: 0 })
  averageMessagesPerSession: number;

  @Prop({ default: 0 })
  peakConcurrentUsers: number;
}

// Content metrics subdocument
@Schema({ _id: false })
export class ContentMetrics {
  @Prop({ default: 0 })
  totalGirlfriendsCreated: number;

  @Prop({ default: 0 })
  stockGirlfriendsSaved: number;

  @Prop({ default: 0 })
  averageGirlfriendsPerUser: number;

  @Prop()
  mostPopularPersonalityType: string;

  @Prop()
  mostPopularPhysicalType: string;

  @Prop({ default: 0 })
  totalCustomizations: number;
}

// Revenue metrics subdocument
@Schema({ _id: false })
export class RevenueMetrics {
  @Prop({ default: 0 })
  totalRevenue: number;

  @Prop({ default: 0 })
  subscriptionRevenue: number;

  @Prop({ default: 0 })
  creditRevenue: number;

  @Prop({ default: 0 })
  refunds: number;

  @Prop({ default: 0 })
  mrr: number; // Monthly Recurring Revenue

  @Prop({ default: 0 })
  arr: number; // Annual Recurring Revenue

  @Prop({ default: 0 })
  averageRevenuePerUser: number;

  @Prop({ default: 0 })
  conversionRate: number;
}

// Subscription metrics subdocument
@Schema({ _id: false })
export class SubscriptionMetrics {
  @Prop({ default: 0 })
  totalActive: number;

  @Prop({ default: 0 })
  totalCancelled: number;

  @Prop({ default: 0 })
  newSubscriptions: number;

  @Prop({ default: 0 })
  renewals: number;

  @Prop({ default: 0 })
  upgrades: number;

  @Prop({ default: 0 })
  downgrades: number;

  @Prop({ default: 0 })
  trialConversions: number;

  @Prop({ default: 0 })
  churnRate: number;
}

// System metrics subdocument
@Schema({ _id: false })
export class SystemMetrics {
  @Prop({ default: 0 })
  apiCalls: number;

  @Prop({ default: 0 })
  averageResponseTime: number;

  @Prop({ default: 0.999 })
  uptime: number;

  @Prop({ default: 0 })
  errorRate: number;

  @Prop({ default: 0 })
  serverCosts: number;

  @Prop({ default: 0 })
  bandwidthUsage: number;

  @Prop({ default: 0 })
  storageUsage: number;

  @Prop({ default: 0 })
  cdnRequests: number;
}

// Country data subdocument
@Schema({ _id: false })
export class CountryData {
  @Prop({ required: true })
  country: string;

  @Prop({ default: 0 })
  users: number;

  @Prop({ default: 0 })
  revenue: number;
}

// Geographic breakdown subdocument
@Schema({ _id: false })
export class Geography {
  @Prop({ type: [CountryData], default: [] })
  topCountries: CountryData[];

  @Prop({ type: [String], default: [] })
  topTimezones: string[];
}

// Platform usage subdocument
@Schema({ _id: false })
export class PlatformUsage {
  @Prop({ default: 0 })
  web: number;

  @Prop({ default: 0 })
  mobile: number;

  @Prop({ default: 0 })
  api: number;
}

// Feature usage subdocument
@Schema({ _id: false })
export class FeatureUsage {
  @Prop({ default: 0 })
  imageGeneration: number;

  @Prop({ default: 0 })
  voiceMessages: number;

  @Prop({ default: 0 })
  exports: number;

  @Prop({ default: 0 })
  customizations: number;

  @Prop({ default: 0 })
  sharing: number;
}

// Main Platform Analytics schema
@Schema({ 
  timestamps: true,
  collection: 'platform_analytics'
})
export class PlatformAnalytics {
  @Prop({ required: true, unique: true })
  date: string; // YYYY-MM-DD format

  @Prop({ type: UserMetrics })
  users: UserMetrics;

  @Prop({ type: UsageMetrics })
  usage: UsageMetrics;

  @Prop({ type: ContentMetrics })
  content: ContentMetrics;

  @Prop({ type: RevenueMetrics })
  revenue: RevenueMetrics;

  @Prop({ type: SubscriptionMetrics })
  subscriptions: SubscriptionMetrics;

  @Prop({ type: SystemMetrics })
  system: SystemMetrics;

  @Prop({ type: Geography })
  geography: Geography;

  @Prop({ type: PlatformUsage })
  platforms: PlatformUsage;

  @Prop({ type: FeatureUsage })
  features: FeatureUsage;

  @Prop()
  generatedAt: Date;
}

export type PlatformAnalyticsDocument = PlatformAnalytics & Document;
export const PlatformAnalyticsSchema = SchemaFactory.createForClass(PlatformAnalytics);

// Indexes
PlatformAnalyticsSchema.index({ date: 1 }, { unique: true });
PlatformAnalyticsSchema.index({ generatedAt: -1 });
