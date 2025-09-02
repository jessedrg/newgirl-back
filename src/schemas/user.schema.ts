import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Profile subdocument
@Schema({ _id: false })
export class Profile {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  displayName: string;

  @Prop()
  bio: string;

  @Prop()
  avatar: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender: string;

  @Prop()
  location: string;

  @Prop()
  timezone: string;
}

// Privacy settings subdocument
@Schema({ _id: false })
export class Privacy {
  @Prop({ default: 'private', enum: ['public', 'private', 'friends'] })
  profileVisibility: string;

  @Prop({ default: false })
  showOnlineStatus: boolean;

  @Prop({ default: true })
  allowDataExport: boolean;
}

// Notification settings subdocument
@Schema({ _id: false })
export class Notifications {
  @Prop({ default: true })
  email: boolean;

  @Prop({ default: true })
  push: boolean;

  @Prop({ default: false })
  marketing: boolean;

  @Prop({ default: true })
  newFeatures: boolean;
}

// Preferences subdocument
@Schema({ _id: false })
export class Preferences {
  @Prop({ default: 'en-US' })
  language: string;

  @Prop({ default: 'dark', enum: ['light', 'dark', 'auto'] })
  theme: string;

  @Prop({ type: Privacy })
  privacy: Privacy;

  @Prop({ type: Notifications })
  notifications: Notifications;
}

// Security subdocument
@Schema({ _id: false })
export class Security {
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  lastPasswordChange: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil: Date;
}

// OAuth provider subdocument
@Schema({ _id: false })
export class OAuthProvider {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: true })
  verified: boolean;
}

// OAuth subdocument
@Schema({ _id: false })
export class OAuth {
  @Prop({ type: OAuthProvider })
  google?: OAuthProvider;

  @Prop({ type: OAuthProvider })
  facebook?: OAuthProvider;

  @Prop({ type: OAuthProvider })
  apple?: OAuthProvider;
}

// Subscription subdocument
@Schema({ _id: false })
export class Subscription {
  @Prop({ default: 'free', enum: ['free', 'basic', 'premium', 'enterprise'] })
  plan: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 'active', enum: ['active', 'cancelled', 'expired', 'suspended'] })
  status: string;

  @Prop()
  stripeCustomerId: string;

  @Prop()
  stripeSubscriptionId: string;
}

// Main User schema
@Schema({ 
  timestamps: true,
  collection: 'users'
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ type: Profile })
  profile: Profile;

  @Prop({ type: Preferences })
  preferences: Preferences;

  @Prop({ 
    default: 'active', 
    enum: ['active', 'suspended', 'deleted', 'pending_verification'] 
  })
  status: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ type: Security })
  security: Security;

  @Prop({ type: OAuth })
  oauth: OAuth;

  @Prop({ type: Subscription })
  subscription: Subscription;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({ type: [{ type: String }], default: [] })
  savedGirlfriends: string[];
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes (email index already created via @Prop unique: true)
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
