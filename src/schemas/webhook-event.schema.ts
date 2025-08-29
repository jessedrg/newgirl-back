import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Billing data subdocument
@Schema({ _id: false })
export class BillingData {
  @Prop()
  initialPrice: string;

  @Prop()
  initialPeriod: string;

  @Prop()
  recurringPrice: string;

  @Prop()
  recurringPeriod: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ enum: ['CREDIT', 'DEBIT', 'PAYPAL', 'CRYPTO'] })
  paymentType: string;
}

// Customer info subdocument
@Schema({ _id: false })
export class CustomerInfo {
  @Prop()
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  country: string;
}

// Product info subdocument
@Schema({ _id: false })
export class ProductInfo {
  @Prop()
  productId: string;

  @Prop()
  productName: string;

  @Prop()
  productDescription: string;
}

// Subscription data subdocument
@Schema({ _id: false })
export class SubscriptionData {
  @Prop()
  nextRenewalDate: Date;

  @Prop({ enum: ['recurring', 'one_time'] })
  subscriptionTypeId: string;

  @Prop()
  trialPeriod: string;
}

// Webhook payload subdocument
@Schema({ _id: false })
export class WebhookPayload {
  // CCBill specific fields
  @Prop()
  clientAccnum: string;

  @Prop()
  clientSubacc: string;

  @Prop()
  subscriptionId: string;

  @Prop()
  transactionId: string;

  @Prop()
  customerId: string;

  @Prop({ type: BillingData })
  billingData: BillingData;

  @Prop({ type: CustomerInfo })
  customerInfo: CustomerInfo;

  @Prop({ type: ProductInfo })
  productInfo: ProductInfo;

  @Prop({ type: SubscriptionData })
  subscriptionData: SubscriptionData;

  // Additional fields for other processors
  @Prop({ type: Object })
  additionalData: Record<string, any>;
}

// Processing status subdocument
@Schema({ _id: false })
export class ProcessingStatus {
  @Prop({ 
    enum: ['pending', 'processed', 'failed', 'ignored'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ default: 1 })
  attempts: number;

  @Prop()
  lastAttempt: Date;

  @Prop()
  error: string;

  @Prop()
  processingTime: number;
}

// Security validation subdocument
@Schema({ _id: false })
export class SecurityValidation {
  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ default: false })
  signatureValid: boolean;

  @Prop({ enum: ['sha256', 'md5', 'sha1'] })
  signatureMethod: string;

  @Prop({ default: false })
  replayPrevented: boolean;
}

// Related entities subdocument
@Schema({ _id: false })
export class References {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  subscriptionId: Types.ObjectId;

  @Prop()
  transactionId: string;
}

// Main Webhook Event schema
@Schema({ 
  timestamps: true,
  collection: 'webhook_events'
})
export class WebhookEvent {
  @Prop({ required: true, unique: true })
  webhookId: string;

  @Prop({ enum: ['ccbill', 'epoch', 'crypto'], required: true })
  processor: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  eventTime: Date;

  @Prop({ type: WebhookPayload })
  payload: WebhookPayload;

  @Prop({ type: ProcessingStatus })
  processing: ProcessingStatus;

  @Prop({ type: SecurityValidation })
  security: SecurityValidation;

  @Prop({ type: References })
  references: References;

  @Prop()
  receivedAt: Date;

  @Prop()
  processedAt: Date;
}

export type WebhookEventDocument = WebhookEvent & Document;
export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

// Indexes
WebhookEventSchema.index({ processor: 1, eventType: 1, receivedAt: -1 });
WebhookEventSchema.index({ 'references.subscriptionId': 1 });
WebhookEventSchema.index({ 'references.userId': 1 });
WebhookEventSchema.index({ 'processing.status': 1 });
WebhookEventSchema.index({ receivedAt: 1 });
WebhookEventSchema.index({ webhookId: 1 }, { unique: true });
