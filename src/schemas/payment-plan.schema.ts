import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentPlanDocument = PaymentPlan & Document;

@Schema({ _id: false })
export class PlanFeatures {
  @Prop({ required: true, min: 0 })
  chatMinutes: number; // Minutes included in the plan

  @Prop({ required: true, min: 0 })
  imageCredits: number; // Credits for purchasing images

  @Prop({ required: true, min: 0 })
  tipCredits: number; // Credits for giving tips to models

  @Prop({ default: false })
  unlimitedChat: boolean; // Premium feature for unlimited chat
}

@Schema({ _id: false })
export class PlanPricing {
  @Prop({ required: true, min: 0 })
  amount: number; // Price in cents (e.g., 999 = $9.99)

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ enum: ['one-time', 'monthly', 'yearly'], required: true })
  type: string;
}

@Schema({ timestamps: true })
export class PaymentPlan {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: PlanPricing, required: true })
  pricing: PlanPricing;

  @Prop({ type: PlanFeatures, required: true })
  features: PlanFeatures;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: false })
  popular: boolean; // Highlight as popular choice

  @Prop({ default: 1 })
  displayOrder: number; // Order to display plans

  @Prop()
  stripeProductId: string; // Stripe product ID for payment processing

  @Prop()
  stripePriceId: string; // Stripe price ID for payment processing
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlan);
