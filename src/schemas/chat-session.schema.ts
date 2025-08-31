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

  @Prop({ type: Boolean, default: false })
  billingPaused: boolean; // Is billing currently paused?

  @Prop({ type: Date, default: null })
  billingPausedAt: Date | null; // When billing was paused

  @Prop({ type: Boolean, default: false })
  billingStarted: boolean; // Has billing started for this session?

  @Prop({ type: Boolean, default: false })
  isUserTyping: boolean; // User typing status

  @Prop({ type: Boolean, default: false })
  isAdminTyping: boolean; // Admin typing status

  @Prop({ type: String, default: null })
  sessionNotes: string | null; // Admin notes about the session
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

// Indexes for performance
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ adminId: 1 });
ChatSessionSchema.index({ status: 1, lastActivity: -1 });
ChatSessionSchema.index({ girlfriendId: 1, status: 1 });

// Unique constraint to prevent duplicate active sessions for same user-girlfriend pair
ChatSessionSchema.index(
  { userId: 1, girlfriendId: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' },
    name: 'unique_active_session'
  }
);
