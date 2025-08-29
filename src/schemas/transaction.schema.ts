import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Transaction details subdocument
@Schema({ _id: false })
export class TransactionDetails {
  @Prop({ 
    enum: ['subscription_payment', 'one_time_payment', 'refund'], 
    required: true 
  })
  type: string;

  @Prop({ 
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ enum: ['ccbill', 'epoch', 'crypto', 'paypal'], required: true })
  processor: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  description: string;
}

// Payment method subdocument
@Schema({ _id: false })
export class PaymentMethod {
  @Prop({ 
    enum: ['credit_card', 'cryptocurrency', 'paypal', 'bank_transfer'], 
    required: true 
  })
  type: string;

  @Prop({ required: true })
  processor: string;

  @Prop()
  last4: string;

  @Prop({ enum: ['visa', 'mastercard', 'amex', 'discover'] })
  brand: string;

  @Prop()
  country: string;
}

// Billing information subdocument
@Schema({ _id: false })
export class BillingInfo {
  @Prop()
  billingDescriptor: string;

  @Prop()
  customerEmail: string;

  @Prop()
  customerCountry: string;

  @Prop()
  ipAddress: string;
}

// Subscription context subdocument
@Schema({ _id: false })
export class TransactionSubscription {
  @Prop()
  planId: string;

  @Prop({ enum: ['monthly', 'yearly'] })
  billingCycle: string;

  @Prop({ default: false })
  isTrialPayment: boolean;

  @Prop({ default: 0 })
  renewalCount: number;

  @Prop()
  nextBillingDate: Date;
}

// Processor-specific data subdocument
@Schema({ _id: false })
export class ProcessorData {
  // CCBill specific
  @Prop()
  clientAccnum: string;

  @Prop()
  clientSubacc: string;

  @Prop()
  approvalCode: string;

  @Prop()
  avsResult: string;

  @Prop()
  cvvResult: string;

  // Epoch specific
  @Prop()
  siteId: string;

  @Prop()
  memberId: string;

  // Crypto specific
  @Prop()
  blockchainTxId: string;

  @Prop()
  confirmations: number;

  @Prop()
  walletAddress: string;

  // Additional processor data
  @Prop({ type: Object })
  additionalData: Record<string, any>;
}

// Fees and costs subdocument
@Schema({ _id: false })
export class Fees {
  @Prop({ default: 0 })
  processorFee: number;

  @Prop({ default: 0 })
  platformFee: number;

  @Prop({ default: 0 })
  netAmount: number;
}

// Risk and fraud detection subdocument
@Schema({ _id: false })
export class RiskAssessment {
  @Prop({ min: 0, max: 1, default: 0 })
  riskScore: number;

  @Prop({ enum: ['passed', 'failed', 'review'], default: 'passed' })
  fraudCheck: string;

  @Prop()
  ipCountry: string;

  @Prop({ enum: ['passed', 'failed'], default: 'passed' })
  velocityCheck: string;

  @Prop({ enum: ['passed', 'failed'], default: 'passed' })
  blacklistCheck: string;
}

// Refund information subdocument
@Schema({ _id: false })
export class RefundInfo {
  @Prop({ default: false })
  isRefunded: boolean;

  @Prop()
  refundAmount: number;

  @Prop()
  refundReason: string;

  @Prop()
  refundedAt: Date;

  @Prop()
  refundTransactionId: string;
}

// Main Transaction schema
@Schema({ 
  timestamps: true,
  collection: 'transactions'
})
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  subscriptionId: Types.ObjectId;

  @Prop({ type: TransactionDetails })
  transaction: TransactionDetails;

  @Prop({ type: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ type: BillingInfo })
  billing: BillingInfo;

  @Prop({ type: TransactionSubscription })
  subscription: TransactionSubscription;

  @Prop({ type: ProcessorData })
  processorData: ProcessorData;

  @Prop({ type: Fees })
  fees: Fees;

  @Prop({ type: RiskAssessment })
  risk: RiskAssessment;

  @Prop({ type: RefundInfo })
  refund: RefundInfo;

  @Prop()
  processedAt: Date;
}

export type TransactionDocument = Transaction & Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ subscriptionId: 1 });
TransactionSchema.index({ 'transaction.status': 1, createdAt: -1 });
TransactionSchema.index({ 'transaction.processor': 1, createdAt: -1 });
TransactionSchema.index({ createdAt: 1 });
