import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Event details subdocument
@Schema({ _id: false })
export class EventDetails {
  @Prop({ 
    enum: ['created', 'activated', 'renewed', 'cancelled', 'expired', 'failed_payment'], 
    required: true 
  })
  type: string;

  @Prop({ enum: ['webhook', 'api', 'admin', 'system'], required: true })
  source: string;

  @Prop({ enum: ['ccbill', 'epoch', 'crypto', 'manual'] })
  processor: string;

  @Prop()
  description: string;
}

// Event data subdocument
@Schema({ _id: false })
export class EventData {
  @Prop()
  previousStatus: string;

  @Prop()
  newStatus: string;

  @Prop()
  planId: string;

  @Prop()
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ enum: ['monthly', 'yearly'] })
  billingCycle: string;
}

// Related transaction subdocument
@Schema({ _id: false })
export class RelatedTransaction {
  @Prop()
  transactionId: string;

  @Prop()
  amount: number;

  @Prop({ enum: ['completed', 'failed', 'pending'] })
  status: string;
}

// Webhook context subdocument
@Schema({ _id: false })
export class WebhookContext {
  @Prop()
  webhookId: string;

  @Prop()
  eventType: string;

  @Prop()
  processor: string;
}

// Limits updated subdocument
@Schema({ _id: false })
export class LimitsUpdated {
  @Prop()
  chatMinutesPerDay: number;

  @Prop()
  messagesPerDay: number;

  @Prop()
  imagesPerDay: number;
}

// System changes subdocument
@Schema({ _id: false })
export class SystemChanges {
  @Prop({ type: [String], default: [] })
  featuresActivated: string[];

  @Prop({ type: LimitsUpdated })
  limitsUpdated: LimitsUpdated;

  @Prop({ type: [String], default: [] })
  notificationsSent: string[];
}

// Main Subscription Event schema
@Schema({ 
  timestamps: true,
  collection: 'subscription_events'
})
export class SubscriptionEvent {
  @Prop({ type: Types.ObjectId, required: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: EventDetails })
  event: EventDetails;

  @Prop({ type: EventData })
  data: EventData;

  @Prop({ type: RelatedTransaction })
  transaction: RelatedTransaction;

  @Prop({ type: WebhookContext })
  webhook: WebhookContext;

  @Prop({ type: SystemChanges })
  changes: SystemChanges;

  @Prop()
  processedAt: Date;
}

export type SubscriptionEventDocument = SubscriptionEvent & Document;
export const SubscriptionEventSchema = SchemaFactory.createForClass(SubscriptionEvent);

// Indexes
SubscriptionEventSchema.index({ subscriptionId: 1, createdAt: -1 });
SubscriptionEventSchema.index({ userId: 1, createdAt: -1 });
SubscriptionEventSchema.index({ 'event.type': 1, createdAt: -1 });
SubscriptionEventSchema.index({ 'webhook.webhookId': 1 });
SubscriptionEventSchema.index({ createdAt: 1 });
