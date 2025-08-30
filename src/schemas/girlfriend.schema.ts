import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GirlfriendDocument = Girlfriend & Document;

@Schema({ timestamps: true })
export class Girlfriend {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  presentationText: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  gallery: string[];

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const GirlfriendSchema = SchemaFactory.createForClass(Girlfriend);
