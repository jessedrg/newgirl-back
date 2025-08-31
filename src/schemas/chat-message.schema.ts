import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['user', 'girlfriend', 'admin'], 
    required: true 
  })
  senderType: string;

  @Prop({ type: String, required: false })
  content: string;

  @Prop({ type: String, enum: ['text', 'image', 'emoji', 'audio'], default: 'text' })
  messageType: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: Date, default: null })
  editedAt: Date | null;

  @Prop({ type: String, default: null })
  originalContent: string | null; // Store original content if edited

  // For admin context - who was pretending to be the girlfriend
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actualSenderId: Types.ObjectId | null; // The admin who sent this as "girlfriend"

  // For message replay functionality
  @Prop({ type: Boolean, default: false })
  deliveredToAdmin: boolean; // Has this message been delivered to admin via WebSocket

  @Prop({ type: Date, default: null })
  deliveredToAdminAt: Date | null; // When message was delivered to admin
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Indexes for performance
ChatMessageSchema.index({ sessionId: 1, sentAt: 1 });
ChatMessageSchema.index({ senderId: 1 });
ChatMessageSchema.index({ sessionId: 1, senderType: 1 });
ChatMessageSchema.index({ sessionId: 1, senderType: 1, deliveredToAdmin: 1 }); // For message replay queries
