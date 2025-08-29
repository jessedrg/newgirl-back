import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Daily usage counts subdocument
@Schema({ _id: false })
export class DailyUsage {
  @Prop({ default: 0 })
  chatMinutes: number;

  @Prop({ default: 0 })
  messagesSent: number;

  @Prop({ default: 0 })
  messagesReceived: number;

  @Prop({ default: 0 })
  imagesGenerated: number;

  @Prop({ default: 0 })
  imagesViewed: number;

  @Prop({ default: 0 })
  apiCalls: number;

  @Prop({ default: 0 })
  girlfriendsCreated: number;

  @Prop({ default: 0 })
  girlfriendsActive: number;

  @Prop({ default: 0 })
  creditsUsed: number;
}

// Chat session subdocument
@Schema({ _id: false })
export class ChatSession {
  @Prop({ type: Types.ObjectId, required: true })
  girlfriendId: Types.ObjectId;

  @Prop({ required: true })
  girlfriendName: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ default: 0 })
  messageCount: number;

  @Prop({ enum: ['happy', 'sad', 'neutral', 'excited', 'romantic'] })
  emotionalTone: string;

  @Prop({ type: [String], default: [] })
  topics: string[];
}

// Image generation subdocument
@Schema({ _id: false })
export class ImageGeneration {
  @Prop({ type: Types.ObjectId, required: true })
  girlfriendId: Types.ObjectId;

  @Prop({ required: true })
  girlfriendName: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ enum: ['realistic', 'anime', 'artistic', 'cartoon'] })
  style: string;

  @Prop({ enum: ['sd', 'hd', 'ultra'] })
  quality: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: 0 })
  cost: number;

  @Prop({ default: true })
  successful: boolean;

  @Prop({ default: 0 })
  processingTime: number;
}

// Feature usage subdocument
@Schema({ _id: false })
export class FeatureUsage {
  @Prop({ default: 0 })
  voiceMessages: number;

  @Prop({ default: 0 })
  imageUploads: number;

  @Prop({ default: 0 })
  exportRequests: number;

  @Prop({ default: 0 })
  searchQueries: number;

  @Prop({ default: 0 })
  profileUpdates: number;
}

// Detailed breakdown subdocument
@Schema({ _id: false })
export class UsageBreakdown {
  @Prop({ type: [ChatSession], default: [] })
  chatSessions: ChatSession[];

  @Prop({ type: [ImageGeneration], default: [] })
  imageGenerations: ImageGeneration[];

  @Prop({ type: FeatureUsage })
  features: FeatureUsage;
}

// Subscription context subdocument
@Schema({ _id: false })
export class SubscriptionContext {
  @Prop({ enum: ['free', 'premium', 'vip'], default: 'free' })
  tier: string;

  @Prop()
  planId: string;

  @Prop({ type: Object })
  limits: Record<string, number>;
}

// Daily limits subdocument
@Schema({ _id: false })
export class DailyLimits {
  @Prop({ default: -1 })
  chatMinutesLimit: number;

  @Prop({ default: -1 })
  messagesLimit: number;

  @Prop({ default: 10 })
  imagesLimit: number;

  @Prop({ default: -1 })
  chatMinutesRemaining: number;

  @Prop({ default: -1 })
  messagesRemaining: number;

  @Prop({ default: 10 })
  imagesRemaining: number;
}

// Context information subdocument
@Schema({ _id: false })
export class UsageContext {
  @Prop()
  timezone: string;

  @Prop()
  country: string;

  @Prop({ enum: ['web', 'mobile', 'api'] })
  primaryDevice: string;

  @Prop({ type: [String], default: [] })
  platforms: string[];

  @Prop({ min: 0, max: 23 })
  peakUsageHour: number;
}

// Main Usage Tracking schema
@Schema({ 
  timestamps: true,
  collection: 'usage_tracking'
})
export class UsageTracking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: false })
  date: string; // YYYY-MM-DD format

  @Prop({ type: DailyUsage })
  usage: DailyUsage;

  @Prop({ type: UsageBreakdown })
  breakdown: UsageBreakdown;

  @Prop({ type: SubscriptionContext })
  subscription: SubscriptionContext;

  @Prop({ type: DailyLimits })
  limits: DailyLimits;

  @Prop({ type: UsageContext })
  context: UsageContext;
}

export type UsageTrackingDocument = UsageTracking & Document;
export const UsageTrackingSchema = SchemaFactory.createForClass(UsageTracking);

// Indexes
UsageTrackingSchema.index({ userId: 1, date: 1 }, { unique: true });
UsageTrackingSchema.index({ userId: 1, createdAt: -1 });
UsageTrackingSchema.index({ date: 1 });
UsageTrackingSchema.index({ 'subscription.tier': 1, date: 1 });
