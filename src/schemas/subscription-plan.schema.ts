import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Pricing information subdocument
@Schema({ _id: false })
export class PricingOption {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;
}

@Schema({ _id: false })
export class Pricing {
  @Prop({ type: PricingOption })
  monthly: PricingOption;

  @Prop({ type: PricingOption })
  yearly: PricingOption;

  @Prop({ min: 0, max: 100 })
  discount: number;
}

// Feature limits subdocument
@Schema({ _id: false })
export class Features {
  @Prop({ default: -1 })
  girlfriends: number; // -1 for unlimited

  @Prop({ default: -1 })
  chatMinutesPerDay: number;

  @Prop({ default: -1 })
  messagesPerDay: number;

  @Prop({ default: 10 })
  imagesPerDay: number;

  @Prop({ default: false })
  prioritySupport: boolean;

  @Prop({ default: false })
  advancedPersonalities: boolean;

  @Prop({ enum: ['basic', 'advanced', 'full'], default: 'basic' })
  customization: string;

  @Prop({ enum: [false, 'mild', 'moderate', 'all'], default: false })
  nsfwContent: string;

  @Prop({ default: false })
  exportData: boolean;

  @Prop({ default: false })
  apiAccess: boolean;

  @Prop({ default: false })
  anonymousPayments: boolean;
}

// Marketing information subdocument
@Schema({ _id: false })
export class Marketing {
  @Prop({ default: false })
  popular: boolean;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 1 })
  displayOrder: number;

  @Prop({ default: '#4F46E5' })
  color: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  highlights: string[];
}

// Trial information subdocument
@Schema({ _id: false })
export class Trial {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: 7 })
  days: number;

  @Prop({ enum: ['limited', 'full'], default: 'limited' })
  features: string;
}

// Payment processor integration subdocument
@Schema({ _id: false })
export class ProcessorConfig {
  @Prop()
  productId: string;

  @Prop()
  flexFormId: string;

  @Prop()
  siteId: string;
}

@Schema({ _id: false })
export class Processors {
  @Prop({ type: ProcessorConfig })
  ccbill: ProcessorConfig;

  @Prop({ type: ProcessorConfig })
  epoch: ProcessorConfig;
}

// Availability subdocument
@Schema({ _id: false })
export class Availability {
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: ['US', 'CA', 'EU', 'UK', 'AU'] })
  regions: string[];

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

// Revenue subdocument
@Schema({ _id: false })
export class Revenue {
  @Prop({ default: 0 })
  monthly: number;

  @Prop({ default: 0 })
  yearly: number;
}

// Analytics subdocument
@Schema({ _id: false })
export class PlanStats {
  @Prop({ default: 0 })
  totalSubscribers: number;

  @Prop({ default: 0 })
  activeSubscribers: number;

  @Prop({ default: 0.05 })
  monthlyChurn: number;

  @Prop({ default: 0 })
  averageLifetime: number;

  @Prop({ type: Revenue })
  revenue: Revenue;
}

// Main Subscription Plan schema
@Schema({ 
  timestamps: true,
  collection: 'subscription_plans'
})
export class SubscriptionPlan {
  @Prop({ required: true, unique: true })
  planId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['free', 'basic', 'premium', 'vip'], required: true })
  tier: string;

  @Prop({ type: Pricing })
  pricing: Pricing;

  @Prop({ type: Features })
  features: Features;

  @Prop({ type: Marketing })
  marketing: Marketing;

  @Prop({ type: Trial })
  trial: Trial;

  @Prop({ type: Processors })
  processors: Processors;

  @Prop({ type: Availability })
  availability: Availability;

  @Prop({ type: PlanStats })
  stats: PlanStats;
}

export type SubscriptionPlanDocument = SubscriptionPlan & Document;
export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

// Indexes
SubscriptionPlanSchema.index({ planId: 1 }, { unique: true });
SubscriptionPlanSchema.index({ 'availability.isActive': 1, 'marketing.displayOrder': 1 });
SubscriptionPlanSchema.index({ tier: 1 });
