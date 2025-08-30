import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ _id: false })
export class TransactionDetails {
  @Prop({ enum: ['chat_minutes', 'image_credits', 'tip_credits', 'subscription'], required: true })
  type: string;

  @Prop({ required: true, min: 0 })
  quantity: number; // Amount of minutes/credits purchased

  @Prop({ required: true, min: 0 })
  unitPrice: number; // Price per unit in cents

  @Prop()
  description: string; // Optional description
}

@Schema({ _id: false })
export class PaymentProvider {
  @Prop({ enum: ['stripe', 'paypal', 'apple_pay', 'google_pay'], required: true })
  name: string;

  @Prop()
  transactionId: string; // Provider's transaction ID

  @Prop()
  paymentMethodId: string; // Payment method used

  @Prop()
  customerId: string; // Customer ID in the payment provider
}

@Schema({ timestamps: true })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentPlan' })
  planId: Types.ObjectId; // Reference to payment plan if applicable

  @Prop({ type: TransactionDetails, required: true })
  details: TransactionDetails;

  @Prop({ required: true, min: 0 })
  totalAmount: number; // Total amount in cents

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ type: PaymentProvider, required: true })
  provider: PaymentProvider;

  @Prop()
  failureReason: string; // Reason for failure if applicable

  @Prop()
  refundedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop({ default: false })
  creditsApplied: boolean; // Whether credits were added to user wallet
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
