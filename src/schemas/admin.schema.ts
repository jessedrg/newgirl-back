import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ 
    type: String, 
    enum: ['super_admin', 'chat_admin', 'support_admin'], 
    default: 'chat_admin' 
  })
  role: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLogin: Date | null;

  @Prop({ type: Boolean, default: false })
  isOnline: boolean; // Currently available for chats

  @Prop({ type: Number, default: 0 })
  activeChatSessions: number; // Number of chats currently handling

  @Prop({ type: Number, default: 5 })
  maxConcurrentChats: number; // Max chats this admin can handle

  @Prop({ type: [String], default: [] })
  specialties: string[]; // Tags they're good at (e.g., ['music', 'travel'])

  @Prop({ type: Object, default: {} })
  stats: {
    totalChatsHandled?: number;
    averageResponseTime?: number; // in seconds
    customerSatisfactionRating?: number;
    totalHoursWorked?: number;
  };
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Indexes
AdminSchema.index({ email: 1 });
AdminSchema.index({ isActive: 1, isOnline: 1 });
AdminSchema.index({ role: 1 });
