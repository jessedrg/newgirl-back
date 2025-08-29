import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Image details subdocument
@Schema({ _id: false })
export class ImageDetails {
  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl: string;

  @Prop()
  filename: string;

  @Prop()
  size: number;

  @Prop({ type: Object })
  dimensions: {
    width: number;
    height: number;
  };

  @Prop({ enum: ['jpg', 'png', 'webp'], default: 'jpg' })
  format: string;

  @Prop({ enum: ['sd', 'hd', 'ultra'], default: 'hd' })
  quality: string;
}

// Generation parameters subdocument
@Schema({ _id: false })
export class GenerationParams {
  @Prop({ required: true })
  jobId: string;

  @Prop({ required: true })
  prompt: string;

  @Prop()
  negativePrompt: string;

  @Prop({ enum: ['realistic', 'anime', 'artistic', 'cartoon'], default: 'realistic' })
  style: string;

  @Prop()
  seed: number;

  @Prop({ default: 50 })
  steps: number;

  @Prop({ default: 7.5 })
  guidance: number;

  @Prop({ default: 'sdxl-1.0' })
  model: string;

  @Prop({ default: 'euler_a' })
  sampler: string;
}

// Processing information subdocument
@Schema({ _id: false })
export class ProcessingInfo {
  @Prop({ 
    enum: ['queued', 'processing', 'completed', 'failed'], 
    default: 'queued' 
  })
  status: string;

  @Prop({ default: 0 })
  queueTime: number;

  @Prop({ default: 0 })
  processingTime: number;

  @Prop({ default: 0 })
  totalTime: number;

  @Prop({ default: 0 })
  retries: number;

  @Prop()
  errorMessage: string;
}

// Usage context subdocument
@Schema({ _id: false })
export class UsageContext {
  @Prop({ 
    enum: ['user_request', 'avatar_generation', 'system_preview'], 
    default: 'user_request' 
  })
  source: string;

  @Prop({ type: Types.ObjectId })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  conversationId: Types.ObjectId;

  @Prop({ default: 0 })
  cost: number;

  @Prop({ enum: ['free', 'premium', 'vip'] })
  subscriptionTier: string;
}

// Content moderation subdocument
@Schema({ _id: false })
export class ModerationCategories {
  @Prop({ min: 0, max: 1, default: 0 })
  nsfw: number;

  @Prop({ min: 0, max: 1, default: 0 })
  violence: number;

  @Prop({ min: 0, max: 1, default: 0 })
  adult: number;

  @Prop({ min: 0, max: 1, default: 0 })
  medical: number;

  @Prop({ min: 0, max: 1, default: 0 })
  racy: number;
}

@Schema({ _id: false })
export class ContentModeration {
  @Prop({ default: false })
  flagged: boolean;

  @Prop({ type: ModerationCategories })
  categories: ModerationCategories;

  @Prop({ min: 0, max: 1 })
  confidence: number;

  @Prop()
  reviewedAt: Date;

  @Prop()
  approvedBy: string;
}

// User interaction subdocument
@Schema({ _id: false })
export class UserInteraction {
  @Prop({ default: false })
  liked: boolean;

  @Prop({ default: false })
  shared: boolean;

  @Prop({ default: false })
  reported: boolean;

  @Prop({ min: 1, max: 5 })
  rating: number;

  @Prop()
  feedback: string;
}

// Main Generated Image schema
@Schema({ 
  timestamps: true,
  collection: 'generated_images'
})
export class GeneratedImage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  girlfriendId: Types.ObjectId;

  @Prop({ type: ImageDetails })
  image: ImageDetails;

  @Prop({ type: GenerationParams })
  generation: GenerationParams;

  @Prop({ type: ProcessingInfo })
  processing: ProcessingInfo;

  @Prop({ type: UsageContext })
  context: UsageContext;

  @Prop({ type: ContentModeration })
  moderation: ContentModeration;

  @Prop({ type: UserInteraction })
  interaction: UserInteraction;

  @Prop()
  completedAt: Date;

  @Prop()
  viewedAt: Date;

  @Prop()
  deletedAt: Date;
}

export type GeneratedImageDocument = GeneratedImage & Document;
export const GeneratedImageSchema = SchemaFactory.createForClass(GeneratedImage);

// Indexes
GeneratedImageSchema.index({ userId: 1, createdAt: -1 });
GeneratedImageSchema.index({ girlfriendId: 1, createdAt: -1 });
GeneratedImageSchema.index({ 'generation.jobId': 1 }, { unique: true });
GeneratedImageSchema.index({ 'processing.status': 1, createdAt: -1 });
GeneratedImageSchema.index({ 'moderation.flagged': 1 });
GeneratedImageSchema.index({ 'context.source': 1, createdAt: -1 });
