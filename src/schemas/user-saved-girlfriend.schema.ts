import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Personalization preferences subdocument
@Schema({ _id: false })
export class PersonalizationPreferences {
  @Prop({ enum: ['more_playful', 'more_serious', 'more_romantic', 'more_casual'] })
  communicationStyle: string;

  @Prop({ min: 1, max: 10 })
  intimacyLevel: number;

  @Prop({ enum: ['short', 'medium', 'long'] })
  responseLength: string;
}

// Personalizations subdocument
@Schema({ _id: false })
export class Personalizations {
  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [String], default: [] })
  nicknames: string[];

  @Prop({ type: PersonalizationPreferences })
  preferences: PersonalizationPreferences;

  @Prop({ type: [String], default: [] })
  customTraits: string[];

  @Prop()
  memoryNotes: string;
}

// Usage statistics subdocument
@Schema({ _id: false })
export class UsageStats {
  @Prop({ default: 0 })
  totalMessages: number;

  @Prop({ default: 0 })
  totalChatMinutes: number;

  @Prop()
  lastChatDate: Date;

  @Prop()
  firstChatDate: Date;

  @Prop({ default: 0 })
  averageSessionTime: number;

  @Prop({ default: 0 })
  totalSessions: number;

  @Prop({ default: 0 })
  longestSession: number;
}

// Memory item subdocument
@Schema({ _id: false })
export class MemoryItem {
  @Prop({ required: true })
  content: string;

  @Prop({ min: 0, max: 1, default: 0.5 })
  importance: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

// Relationship preferences subdocument
@Schema({ _id: false })
export class RelationshipPreferences {
  @Prop({ type: [String], default: [] })
  favoriteTopics: string[];

  @Prop({ enum: ['morning_chats', 'afternoon_chats', 'evening_chats', 'night_chats'] })
  communicationPattern: string;

  @Prop({ enum: ['upbeat', 'calm', 'romantic', 'playful'] })
  moodPreference: string;
}

// Relationship development subdocument
@Schema({ _id: false })
export class RelationshipDevelopment {
  @Prop({ default: 1, min: 1, max: 10 })
  level: number;

  @Prop({ type: [MemoryItem], default: [] })
  memories: MemoryItem[];

  @Prop({ type: RelationshipPreferences })
  preferences: RelationshipPreferences;
}

// Chat configuration subdocument
@Schema({ _id: false })
export class ChatConfig {
  @Prop({ type: Types.ObjectId })
  conversationId: Types.ObjectId;

  @Prop()
  lastWelcomeMessage: string;

  @Prop()
  contextSummary: string;
}

// Main User Saved Girlfriend schema
@Schema({ 
  timestamps: true,
  collection: 'user_saved_girlfriends'
})
export class UserSavedGirlfriend {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['stock', 'created'], required: true })
  type: string;

  // For stock girlfriends
  @Prop({ type: Types.ObjectId, ref: 'StockGirlfriend' })
  stockGirlfriendId: Types.ObjectId;

  @Prop()
  customName: string;

  // For created girlfriends
  @Prop({ type: Types.ObjectId, ref: 'Girlfriend' })
  girlfriendId: Types.ObjectId;

  @Prop({ type: Personalizations })
  personalizations: Personalizations;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ 
    enum: ['active', 'archived', 'paused'], 
    default: 'active' 
  })
  status: string;

  @Prop({ type: UsageStats })
  stats: UsageStats;

  @Prop({ type: RelationshipDevelopment })
  relationship: RelationshipDevelopment;

  @Prop({ type: ChatConfig })
  chatConfig: ChatConfig;

  @Prop()
  savedAt: Date;

  @Prop()
  archivedAt: Date;

  @Prop()
  deletedAt: Date;
}

export type UserSavedGirlfriendDocument = UserSavedGirlfriend & Document;
export const UserSavedGirlfriendSchema = SchemaFactory.createForClass(UserSavedGirlfriend);

// Indexes
UserSavedGirlfriendSchema.index({ userId: 1, status: 1 });
UserSavedGirlfriendSchema.index({ userId: 1, type: 1 });
UserSavedGirlfriendSchema.index({ userId: 1, isFavorite: 1 });
UserSavedGirlfriendSchema.index({ stockGirlfriendId: 1 });
UserSavedGirlfriendSchema.index({ girlfriendId: 1 });
UserSavedGirlfriendSchema.index({ 'stats.lastChatDate': -1 });
