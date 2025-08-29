import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { 
  Physical, 
  Personality, 
  Avatar, 
  GalleryItem 
} from './girlfriend.schema';

// Content classification subdocument
@Schema({ _id: false })
export class ContentClassification {
  @Prop({ enum: ['girlfriend', 'fantasy', 'roleplay'], default: 'girlfriend' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: '18+' })
  ageRating: string;

  @Prop({ type: [String], default: [] })
  contentWarnings: string[];
}

// Media for stock girlfriends subdocument
@Schema({ _id: false })
export class StockMedia {
  @Prop()
  avatar: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ type: [GalleryItem], default: [] })
  gallery: GalleryItem[];

  @Prop()
  voiceSample: string;
}

// Analytics and performance subdocument
@Schema({ _id: false })
export class StockStats {
  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  saves: number;

  @Prop({ default: 0 })
  interactions: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0.0, min: 0, max: 1 })
  popularity: number;

  @Prop()
  lastUpdated: Date;
}

// Publishing information subdocument
@Schema({ _id: false })
export class Publishing {
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop()
  featuredUntil: Date;

  @Prop()
  publishedAt: Date;

  @Prop({ default: 'admin' })
  createdBy: string;

  @Prop({ default: 'content_team' })
  approvedBy: string;

  @Prop({ default: '1.0' })
  version: string;
}

// Main Stock Girlfriend schema
@Schema({ 
  timestamps: true,
  collection: 'stock_girlfriends'
})
export class StockGirlfriend {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: ContentClassification })
  content: ContentClassification;

  @Prop({ type: Personality })
  personality: Personality;

  @Prop({ type: Physical })
  physical: Physical;

  @Prop({ type: StockMedia })
  media: StockMedia;

  @Prop({ type: StockStats })
  stats: StockStats;

  @Prop({ type: Publishing })
  publishing: Publishing;

  @Prop()
  deletedAt: Date;
}

export type StockGirlfriendDocument = StockGirlfriend & Document;
export const StockGirlfriendSchema = SchemaFactory.createForClass(StockGirlfriend);

// Indexes
StockGirlfriendSchema.index({ 'content.category': 1, 'publishing.isActive': 1 });
StockGirlfriendSchema.index({ 'stats.popularity': -1, 'publishing.isActive': 1 });
StockGirlfriendSchema.index({ 'content.tags': 1 });
StockGirlfriendSchema.index({ 'personality.personalityType': 1 });
StockGirlfriendSchema.index({ 'content.isPremium': 1, 'stats.popularity': -1 });
StockGirlfriendSchema.index({ 'stats.rating': -1 });
