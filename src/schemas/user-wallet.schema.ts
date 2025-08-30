import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserWalletDocument = UserWallet & Document;

@Schema({ _id: false })
export class WalletBalance {
  @Prop({ default: 0, min: 0 })
  chatMinutes: number; // Available chat minutes

  @Prop({ default: 0, min: 0 })
  imageCredits: number; // Available image purchase credits

  @Prop({ default: 0, min: 0 })
  tipCredits: number; // Available tip credits
}

@Schema({ _id: false })
export class UsageTracking {
  @Prop({ default: 0 })
  totalChatMinutesUsed: number;

  @Prop({ default: 0 })
  totalImagesGenerated: number;

  @Prop({ default: 0 })
  totalTipsGiven: number;

  @Prop({ default: 0 })
  totalSpent: number; // Total amount spent in cents
}

@Schema({ timestamps: true })
export class UserWallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: WalletBalance, default: () => ({}) })
  balance: WalletBalance;

  @Prop({ type: UsageTracking, default: () => ({}) })
  usage: UsageTracking;

  @Prop({ default: false })
  hasActiveSubscription: boolean;

  @Prop()
  subscriptionExpiresAt: Date;

  @Prop({ default: Date.now })
  lastActivity: Date;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);
