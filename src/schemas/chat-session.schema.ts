import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Girlfriend', required: true })
  girlfriendId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['active', 'paused', 'ended'], 
    default: 'active' 
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  adminId: Types.ObjectId | null; // Admin currently handling this chat

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: Date, default: Date.now })
  lastActivity: Date;

  @Prop({ type: Number, default: 0 })
  totalMessages: number;

  @Prop({ type: Number, default: 0 })
  minutesUsed: number; // For billing purposes

  @Prop({ type: Boolean, default: false })
  isAdminActive: boolean; // Is an admin currently in this chat?

  @Prop({ type: String, default: null })
  sessionNotes: string | null; // Admin notes about the session
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

// Indexes for performance
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ adminId: 1 });
ChatSessionSchema.index({ status: 1, lastActivity: -1 });
ChatSessionSchema.index({ girlfriendId: 1, status: 1 });
