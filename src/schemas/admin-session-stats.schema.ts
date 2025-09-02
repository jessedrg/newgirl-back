import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminSessionStatsDocument = AdminSessionStats & Document;

@Schema({ timestamps: true })
export class AdminSessionStats {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date; // Date for daily statistics (YYYY-MM-DD format)

  @Prop({ type: Number, default: 0 })
  totalMinutes: number; // Total minutes worked this day

  @Prop({ type: Number, default: 0 })
  totalSessions: number; // Number of chat sessions handled

  @Prop({ type: Number, default: 0 })
  activeMinutes: number; // Minutes actively chatting (not paused)

  @Prop({ type: Number, default: 0 })
  pausedMinutes: number; // Minutes paused/away

  @Prop({ type: Number, default: 0 })
  averageSessionLength: number; // Average session length in minutes

  @Prop({ type: Date, default: null })
  firstSessionStart: Date | null; // When first session started

  @Prop({ type: Date, default: null })
  lastSessionEnd: Date | null; // When last session ended

  @Prop({ type: [Types.ObjectId], default: [] })
  sessionIds: Types.ObjectId[]; // References to chat sessions

  @Prop({ type: Map, of: Number, default: new Map() })
  hourlyBreakdown: Map<string, number>; // Minutes per hour (0-23)

  @Prop({ type: Number, default: 0 })
  uniqueUsers: number; // Number of unique users chatted with

  @Prop({ type: [Types.ObjectId], default: [] })
  userIds: Types.ObjectId[]; // List of users chatted with
}

export const AdminSessionStatsSchema = SchemaFactory.createForClass(AdminSessionStats);

// Indexes for performance
AdminSessionStatsSchema.index({ adminId: 1, date: -1 }, { unique: true });
AdminSessionStatsSchema.index({ date: -1 });
AdminSessionStatsSchema.index({ adminId: 1 });
