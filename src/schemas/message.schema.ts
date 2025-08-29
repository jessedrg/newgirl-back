import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Attachment subdocument
@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  id: string;

  @Prop({ enum: ['image', 'voice', 'file', 'sticker'], required: true })
  type: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl: string;

  @Prop()
  filename: string;

  @Prop()
  size: number;

  @Prop()
  caption: string;
}

// Content metadata subdocument
@Schema({ _id: false })
export class ContentMetadata {
  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ enum: ['positive', 'negative', 'neutral'] })
  sentiment: string;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ default: 'en' })
  language: string;
}

// Message content subdocument
@Schema({ _id: false })
export class Content {
  @Prop({ required: true })
  text: string;

  @Prop({ enum: ['text', 'image', 'voice', 'file', 'sticker'], default: 'text' })
  type: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @Prop({ type: ContentMetadata })
  metadata: ContentMetadata;
}

// Message sender subdocument
@Schema({ _id: false })
export class Sender {
  @Prop({ enum: ['user', 'ai'], required: true })
  type: string;

  @Prop({ required: true })
  name: string;
}

// AI emotion subdocument
@Schema({ _id: false })
export class Emotion {
  @Prop()
  tone: string;

  @Prop({ min: 0, max: 1 })
  empathy: number;

  @Prop({ min: 0, max: 1 })
  flirtiness: number;
}

// AI response context subdocument
@Schema({ _id: false })
export class AiContext {
  @Prop({ default: 'gpt-4' })
  model: string;

  @Prop()
  systemPrompt: string;

  @Prop({ default: 0.7 })
  temperature: number;

  @Prop()
  processingTime: number;

  @Prop()
  tokensUsed: number;

  @Prop({ type: Emotion })
  emotion: Emotion;

  @Prop({ type: [String], default: [] })
  memoryUsed: string[];
}

// Moderation subdocument
@Schema({ _id: false })
export class Moderation {
  @Prop({ default: false })
  flagged: boolean;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ min: 0, max: 1 })
  confidence: number;

  @Prop()
  reviewedAt: Date;

  @Prop()
  reviewedBy: string;
}

// Timestamps subdocument
@Schema({ _id: false })
export class Timestamps {
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  editedAt: Date;

  @Prop()
  deletedAt: Date;
}

// Main Message schema
@Schema({ 
  timestamps: true,
  collection: 'messages'
})
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  girlfriendId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Content, required: true })
  content: Content;

  @Prop({ type: Sender, required: true })
  sender: Sender;

  @Prop({ type: AiContext })
  aiContext: AiContext;

  @Prop({ 
    enum: ['sending', 'delivered', 'read', 'failed'], 
    default: 'delivered' 
  })
  status: string;

  @Prop()
  readAt: Date;

  @Prop({ type: Moderation })
  moderation: Moderation;

  @Prop({ type: Timestamps })
  timestamps: Timestamps;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ userId: 1, conversationId: 1, 'timestamps.createdAt': -1 });
MessageSchema.index({ girlfriendId: 1, 'timestamps.createdAt': -1 });
MessageSchema.index({ 'timestamps.createdAt': -1 });
MessageSchema.index({ status: 1, 'timestamps.createdAt': -1 });
MessageSchema.index({ 'moderation.flagged': 1 });
