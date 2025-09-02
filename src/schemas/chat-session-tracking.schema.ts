import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatSessionTrackingDocument = ChatSessionTracking & Document;

@Schema({ timestamps: true })
export class ChatSessionTracking {
  @Prop({ type: Types.ObjectId, ref: 'ChatSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, default: null })
  endTime: Date | null;

  @Prop({ type: Number, default: 0 })
  minutesTracked: number; // Total minutes for this tracking period

  @Prop({ type: Number, default: 0 })
  secondsTracked: number; // Precise seconds for billing

  @Prop({ 
    type: String, 
    enum: ['active', 'paused', 'ended'], 
    default: 'active' 
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  lastPing: Date; // Last activity ping for real-time tracking

  @Prop({ type: Boolean, default: false })
  billingActive: boolean; // Is this period being billed?

  @Prop({ type: String, default: null })
  pauseReason: string | null; // Reason for pause (admin_away, user_inactive, etc.)

  @Prop({ type: Date, default: null })
  pausedAt: Date | null;

  @Prop({ type: Date, default: null })
  resumedAt: Date | null;

  @Prop({ type: Number, default: 0 })
  pausedDuration: number; // Total paused time in seconds
}

export const ChatSessionTrackingSchema = SchemaFactory.createForClass(ChatSessionTracking);

// Indexes for performance
ChatSessionTrackingSchema.index({ sessionId: 1, status: 1 });
ChatSessionTrackingSchema.index({ adminId: 1, startTime: -1 });
ChatSessionTrackingSchema.index({ userId: 1, startTime: -1 });
ChatSessionTrackingSchema.index({ startTime: 1 }); // For daily statistics
ChatSessionTrackingSchema.index({ status: 1, lastPing: -1 }); // For active session monitoring
