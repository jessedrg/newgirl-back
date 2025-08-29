import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid'
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ULTIMATE = 'ultimate'
}

export enum PaymentProcessor {
  CCBILL = 'ccbill'
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  planId: string;

  @Prop({ required: true })
  planName: string;

  @Prop({ type: String, enum: SubscriptionTier, required: true, index: true })
  tier: SubscriptionTier;

  @Prop({ type: String, enum: SubscriptionStatus, required: true, index: true })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: PaymentProcessor, required: true })
  processor: PaymentProcessor;

  @Prop({ required: true })
  transactionId: string;

  @Prop()
  ccbillSubscriptionId?: string;

  @Prop()
  ccbillCustomerId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true })
  billingCycle: string; // 'monthly' | 'yearly'

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  trialEnd?: Date;

  @Prop()
  nextBillingDate?: Date;

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop()
  canceledAt?: Date;

  @Prop()
  cancelReason?: string;

  @Prop({ default: false })
  anonymous: boolean;

  @Prop({ default: 'DIGITAL SERVICES' })
  billingDescriptor: string;

  @Prop()
  couponCode?: string;

  @Prop()
  discountAmount?: number;

  @Prop()
  discountType?: string; // 'percentage' | 'fixed'

  @Prop({ type: Object })
  features?: {
    girlfriends: number; // -1 for unlimited
    chatMinutesPerDay: number; // -1 for unlimited
    messagesPerDay: number; // -1 for unlimited
    imagesPerDay: number;
    prioritySupport: boolean;
    advancedPersonalities: boolean;
    customization: string;
    nsfwContent: boolean | string;
  };

  @Prop({ type: Object })
  billingHistory?: Array<{
    date: Date;
    amount: number;
    currency: string;
    transactionId: string;
    status: string;
    processor: string;
  }>;

  @Prop({ type: Object })
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    referrer?: string;
  };

  @Prop()
  deletedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes for performance
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ processor: 1, transactionId: 1 });
SubscriptionSchema.index({ ccbillSubscriptionId: 1 });
SubscriptionSchema.index({ status: 1, nextBillingDate: 1 });
SubscriptionSchema.index({ deletedAt: 1 });
