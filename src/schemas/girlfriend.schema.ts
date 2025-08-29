import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Creation tracking subdocument
@Schema({ _id: false })
export class Creation {
  @Prop({ default: 1, min: 1, max: 6 })
  step: number;

  @Prop({ type: [Number], default: [] })
  completedSteps: number[];

  @Prop()
  sessionId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  completedAt: Date;
}

// Creation session subdocument (for active creation process)
@Schema({ _id: false })
export class CreationSession {
  @Prop({ default: 1, min: 1, max: 6 })
  currentStep: number;

  @Prop({ type: [Number], default: [] })
  completedSteps: number[];

  @Prop()
  token: string;

  @Prop()
  expiresAt: Date;

  @Prop()
  createdAt: Date;
}

// Basic information subdocument
@Schema({ _id: false })
export class Basic {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop()
  description: string;

  @Prop()
  occupation: string;

  @Prop()
  location: string;

  @Prop()
  nationality: string;

  @Prop()
  backstory: string;
}

// Facial features subdocument
@Schema({ _id: false })
export class Face {
  @Prop({ enum: ['oval', 'round', 'square', 'heart', 'diamond'] })
  shape: string;

  @Prop({ enum: ['blue', 'brown', 'green', 'hazel', 'gray', 'amber'] })
  eyeColor: string;

  @Prop({ enum: ['blue', 'brown', 'green', 'hazel', 'gray', 'amber'] })
  color: string;

  @Prop({ enum: ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned'] })
  eyeShape: string;

  @Prop({ enum: ['small', 'medium', 'large'] })
  eyeSize: string;

  @Prop({ enum: ['thin', 'medium', 'thick', 'arched', 'straight'] })
  eyebrowStyle: string;

  @Prop({ enum: ['straight', 'roman', 'button', 'aquiline', 'snub'] })
  noseShape: string;

  @Prop({ enum: ['thin', 'medium', 'full', 'heart', 'bow'] })
  lipShape: string;

  @Prop({ enum: ['small', 'medium', 'large'] })
  lipSize: string;

  @Prop({ enum: ['low', 'medium', 'high', 'prominent'] })
  cheekbones: string;

  @Prop({ enum: ['soft', 'defined', 'sharp', 'square'] })
  jawline: string;

  @Prop({ enum: ['pointed', 'round', 'square', 'cleft'] })
  chinShape: string;

  @Prop({ default: false })
  dimples: boolean;

  @Prop({ default: false })
  freckles: boolean;
}

// Hair subdocument
@Schema({ _id: false })
export class Hair {
  @Prop({ enum: ['short', 'medium', 'long', 'very_long'] })
  length: string;

  @Prop({ enum: ['straight', 'wavy', 'curly', 'coily'] })
  style: string;

  @Prop({ enum: ['blonde', 'brown', 'black', 'red', 'auburn', 'gray', 'white'] })
  color: string;

  @Prop()
  highlights: string;

  @Prop({ enum: ['fine', 'medium', 'thick'] })
  texture: string;

  @Prop({ default: false })
  bangs: boolean;

  @Prop()
  bangStyle: string;
}

// Skin subdocument
@Schema({ _id: false })
export class Skin {
  @Prop({ enum: ['very_fair', 'fair', 'light', 'medium', 'tan', 'dark', 'very_dark'] })
  tone: string;

  @Prop({ enum: ['cool', 'warm', 'neutral'] })
  undertone: string;

  @Prop({ enum: ['smooth', 'textured', 'oily', 'dry', 'combination'] })
  texture: string;

  @Prop({ default: false })
  blemishes: boolean;

  @Prop({ default: false })
  freckles: boolean;

  @Prop({ default: false })
  moles: boolean;

  @Prop({ type: [String], default: [] })
  scars: string[];
}

// Legs subdocument
@Schema({ _id: false })
export class Legs {
  @Prop({ enum: ['short', 'average', 'long'] })
  length: string;

  @Prop({ enum: ['slim', 'athletic', 'curvy', 'thick'] })
  shape: string;

  @Prop({ default: false })
  thighGap: boolean;
}

// Arms subdocument
@Schema({ _id: false })
export class Arms {
  @Prop({ enum: ['short', 'average', 'long'] })
  length: string;

  @Prop({ enum: ['slim', 'toned', 'muscular', 'soft'] })
  muscleTone: string;
}

// Intimate details subdocument (18+ content)
@Schema({ _id: false })
export class Intimate {
  @Prop({ enum: ['natural', 'trimmed', 'shaved', 'waxed'] })
  pubicHair: string;

  @Prop({ enum: ['small', 'medium', 'large'] })
  nippleSize: string;

  @Prop({ enum: ['pink', 'brown', 'dark'] })
  nippleColor: string;

  @Prop({ enum: ['low', 'medium', 'high'] })
  sensitivity: string;
}

// Body modifications subdocument
@Schema({ _id: false })
export class Tattoo {
  @Prop()
  location: string;

  @Prop({ enum: ['small', 'medium', 'large'] })
  size: string;

  @Prop()
  style: string;

  @Prop()
  description: string;
}

@Schema({ _id: false })
export class Modifications {
  @Prop({ type: [Tattoo], default: [] })
  tattoos: Tattoo[];

  @Prop({ type: [String], default: [] })
  piercings: string[];

  @Prop({ type: [String], default: [] })
  surgeries: string[];
}

// Style subdocument
@Schema({ _id: false })
export class Style {
  @Prop({ enum: ['casual', 'elegant', 'bohemian', 'sporty', 'gothic', 'vintage'] })
  fashion: string;

  @Prop({ enum: ['natural', 'light', 'medium', 'heavy', 'glamorous'] })
  makeup: string;

  @Prop({ enum: ['short', 'medium', 'long'] })
  nails: string;

  @Prop()
  nailColor: string;

  @Prop({ type: [String], default: [] })
  accessories: string[];

  @Prop({ type: [String], default: [] })
  preferredColors: string[];
}

// Physical attributes subdocument
@Schema({ _id: false })
export class Physical {
  @Prop()
  height: string;

  @Prop({ enum: ['very_slim', 'slim', 'average', 'curvy', 'plus_size'] })
  weight: string;

  @Prop({ enum: ['caucasian', 'african', 'asian', 'hispanic', 'middle_eastern', 'mixed'] })
  ethnicity: string;

  @Prop({ enum: ['slim', 'athletic', 'curvy', 'pear', 'apple', 'hourglass'] })
  bodyType: string;

  @Prop({ enum: ['AA', 'A', 'B', 'C', 'D', 'DD', 'DDD', 'E', 'F', 'G'] })
  breastSize: string;

  @Prop({ enum: ['round', 'teardrop', 'athletic', 'wide_set'] })
  breastShape: string;

  @Prop({ enum: ['small', 'medium', 'large', 'extra_large'] })
  buttSize: string;

  @Prop({ enum: ['round', 'heart', 'square', 'athletic'] })
  buttShape: string;

  @Prop({ enum: ['tiny', 'small', 'medium', 'large'] })
  waistSize: string;

  @Prop({ enum: ['small', 'medium', 'large', 'extra_large'] })
  hipSize: string;

  @Prop({ type: Face })
  face: Face;

  @Prop({ type: Face })
  eyes: Face;

  @Prop({ type: Hair })
  hair: Hair;

  @Prop({ type: Skin })
  skin: Skin;

  @Prop({ type: Legs })
  legs: Legs;

  @Prop({ type: Arms })
  arms: Arms;

  @Prop({ type: Intimate })
  intimate: Intimate;

  @Prop({ type: Modifications })
  modifications: Modifications;

  @Prop({ type: Style })
  style: Style;
}

// Personality traits subdocument
@Schema({ _id: false })
export class Traits {
  @Prop({ min: 1, max: 10, default: 5 })
  dominance: number;

  @Prop({ min: 1, max: 10, default: 5 })
  extroversion: number;

  @Prop({ min: 1, max: 10, default: 5 })
  agreeableness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  openness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  conscientiousness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  neuroticism: number;

  @Prop({ min: 1, max: 10, default: 5 })
  intelligence: number;

  @Prop({ min: 1, max: 10, default: 5 })
  confidence: number;

  @Prop({ min: 1, max: 10, default: 5 })
  playfulness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  jealousy: number;

  @Prop({ min: 1, max: 10, default: 5 })
  adventurousness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  empathy: number;

  @Prop({ min: 1, max: 10, default: 5 })
  humor: number;
}

// Communication style subdocument
@Schema({ _id: false })
export class Communication {
  @Prop({ enum: ['sweet', 'warm', 'playful', 'serious', 'sultry', 'bubbly'] })
  speakingStyle: string;

  @Prop({ enum: ['sweet', 'warm', 'playful', 'serious', 'sultry', 'bubbly'] })
  style: string;

  @Prop({ enum: ['sweet', 'warm', 'playful', 'serious', 'sultry', 'bubbly'] })
  tone: string;

  @Prop({ enum: ['simple', 'average', 'sophisticated', 'academic'] })
  vocabulary: string;

  @Prop({ enum: ['dry', 'witty', 'silly', 'sarcastic', 'playful'] })
  humor: string;

  @Prop({ enum: ['reserved', 'moderate', 'expressive', 'dramatic'] })
  emotionalExpression: string;

  @Prop({ enum: ['subtle', 'romantic', 'playful', 'direct', 'teasing'] })
  flirtingStyle: string;

  @Prop({ enum: ['formal', 'casual', 'emojis', 'abbreviations'] })
  textingStyle: string;
}

// Interests subdocument
@Schema({ _id: false })
export class Interests {
  @Prop({ type: [String], default: [] })
  hobbies: string[];

  @Prop({ type: [String], default: [] })
  music: string[];

  @Prop({ type: [String], default: [] })
  movies: string[];

  @Prop({ type: [String], default: [] })
  books: string[];

  @Prop({ type: [String], default: [] })
  food: string[];

  @Prop({ type: [String], default: [] })
  activities: string[];
}

// Sexual preferences subdocument (18+ content)
@Schema({ _id: false })
export class SexualPreferences {
  @Prop({ default: false })
  roleplay: boolean;

  @Prop({ enum: ['gentle', 'moderate', 'rough', 'very_rough'] })
  roughness: string;

  @Prop({ enum: ['slow', 'moderate', 'fast', 'varied'] })
  pace: string;

  @Prop({ type: [String], default: [] })
  positions: string[];

  @Prop({ type: [String], default: [] })
  locations: string[];

  @Prop({ type: [String], default: [] })
  timeOfDay: string[];

  @Prop({ enum: ['daily', 'few_times_week', 'weekly', 'few_times_month', 'monthly'] })
  frequency: string;
}

// Submissive traits subdocument
@Schema({ _id: false })
export class SubmissiveTraits {
  @Prop({ min: 1, max: 10, default: 5 })
  obedience: number;

  @Prop({ min: 1, max: 10, default: 5 })
  bratiness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  needsApproval: number;

  @Prop({ min: 1, max: 10, default: 5 })
  followsOrders: number;

  @Prop({ type: [String], default: [] })
  punishment: string[];

  @Prop({ type: [String], default: [] })
  rewards: string[];
}

// Dominant traits subdocument
@Schema({ _id: false })
export class DominantTraits {
  @Prop({ min: 1, max: 10, default: 5 })
  control: number;

  @Prop({ min: 1, max: 10, default: 5 })
  strictness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  nurturing: number;

  @Prop({ type: [String], default: [] })
  commands: string[];

  @Prop({ type: [String], default: [] })
  punishments: string[];

  @Prop({ type: [String], default: [] })
  rewards: string[];
}

// Sexual personality subdocument
@Schema({ _id: false })
export class Sexual {
  @Prop({ enum: ['inexperienced', 'some_experience', 'experienced', 'very_experienced'] })
  experience: string;

  @Prop({ min: 1, max: 10, default: 5 })
  libido: number;

  @Prop({ min: 1, max: 10, default: 5 })
  initiative: number;

  @Prop({ min: 1, max: 10, default: 5 })
  adventurousness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  dominance: number;

  @Prop({ type: SexualPreferences })
  preferences: SexualPreferences;

  @Prop({ type: [String], default: [] })
  kinks: string[];

  @Prop({ type: [String], default: [] })
  boundaries: string[];

  @Prop({ type: [String], default: [] })
  turnOns: string[];

  @Prop({ type: [String], default: [] })
  turnOffs: string[];

  @Prop({ type: SubmissiveTraits })
  submissiveTraits: SubmissiveTraits;

  @Prop({ type: DominantTraits })
  dominantTraits: DominantTraits;
}

// Relationship style subdocument
@Schema({ _id: false })
export class Relationship {
  @Prop({ enum: ['girlfriend', 'wife', 'friend', 'casual', 'dominant', 'submissive'] })
  type: string;

  @Prop({ enum: ['girlfriend', 'wife', 'friend', 'casual', 'dominant', 'submissive'] })
  style: string;

  @Prop({ min: 1, max: 10, default: 5 })
  intimacyLevel: number;

  @Prop({ min: 1, max: 10, default: 5 })
  affectionLevel: number;

  @Prop({ min: 1, max: 10, default: 5 })
  possessiveness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  neediness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  loyalty: number;

  @Prop({ type: [String], default: [] })
  loveLanguages: string[];

  @Prop({ enum: ['avoidant', 'direct', 'passive_aggressive', 'mature'] })
  conflictStyle: string;

  @Prop({ enum: ['secure', 'anxious', 'avoidant', 'disorganized'] })
  attachmentStyle: string;
}

// Personality subdocument
@Schema({ _id: false })
export class Personality {
  @Prop({ enum: ['caregiver', 'adventurer', 'intellectual', 'romantic', 'playful', 'dominant', 'submissive'] })
  personalityType: string;

  @Prop({ enum: ['caregiver', 'adventurer', 'intellectual', 'romantic', 'playful', 'dominant', 'submissive'] })
  type: string;

  @Prop({ type: Traits })
  traits: Traits;

  @Prop({ type: Communication })
  communication: Communication;

  @Prop({ type: Interests })
  interests: Interests;

  @Prop({ type: Sexual })
  sexual: Sexual;

  @Prop({ type: Relationship })
  relationship: Relationship;

  @Prop({ type: [String], default: [] })
  quirks: string[];

  @Prop({ type: [String], default: [] })
  fears: string[];

  @Prop({ type: [String], default: [] })
  dreams: string[];

  @Prop({ type: [String], default: [] })
  secrets: string[];
}

// Response style subdocument
@Schema({ _id: false })
export class ResponseStyle {
  @Prop({ enum: ['short', 'medium', 'long'], default: 'medium' })
  length: string;

  @Prop({ enum: ['casual', 'formal', 'playful'], default: 'casual' })
  formality: string;

  @Prop({ enum: ['reserved', 'moderate', 'expressive'], default: 'moderate' })
  emotiveness: string;

  @Prop({ min: 1, max: 10, default: 5 })
  flirtiness: number;

  @Prop({ min: 1, max: 10, default: 5 })
  sexualness: number;
}

// Memory settings subdocument
@Schema({ _id: false })
export class Memory {
  @Prop({ default: true })
  rememberConversations: boolean;

  @Prop({ default: true })
  adaptToUser: boolean;

  @Prop({ default: true })
  learnPreferences: boolean;

  @Prop({ default: false })
  personalityEvolution: boolean;
}

// Content filters subdocument
@Schema({ _id: false })
export class ContentFilters {
  @Prop({ min: 0, max: 5, default: 3 })
  nsfwLevel: number;

  @Prop({ min: 0, max: 5, default: 1 })
  violenceLevel: number;

  @Prop({ min: 0, max: 5, default: 2 })
  profanityLevel: number;

  @Prop({ type: [String], default: [] })
  tabooTopics: string[];
}

// Voice settings subdocument
@Schema({ _id: false })
export class Voice {
  @Prop({ default: 'elevenlabs' })
  provider: string;

  @Prop()
  voiceId: string;

  @Prop({ default: 1.0 })
  speed: number;

  @Prop({ default: 0 })
  pitch: number;

  @Prop({ default: 'happy' })
  emotion: string;

  @Prop()
  accent: string;
}

// AI Configuration subdocument
@Schema({ _id: false })
export class AiConfig {
  @Prop({ type: ResponseStyle })
  responseStyle: ResponseStyle;

  @Prop({ type: Memory })
  memory: Memory;

  @Prop({ type: ContentFilters })
  contentFilters: ContentFilters;

  @Prop({ type: [String], default: [] })
  conversationStarters: string[];

  @Prop({ type: Voice })
  voice: Voice;

  @Prop()
  systemPrompt: string;

  @Prop({ default: 0.7 })
  temperature: number;

  @Prop({ default: 2048 })
  maxTokens: number;

  @Prop({ default: true })
  memoryEnabled: boolean;

  @Prop({ default: true })
  emotionDetection: boolean;
}

// Media avatar subdocument
@Schema({ _id: false })
export class Avatar {
  @Prop()
  url: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ type: [String], default: [] })
  variations: string[];
}

// Media gallery item subdocument
@Schema({ _id: false })
export class GalleryItem {
  @Prop()
  url: string;

  @Prop()
  prompt: string;

  @Prop({ enum: ['lifestyle', 'portrait', 'intimate', 'outdoor', 'casual'] })
  type: string;
}

// Media subdocument
@Schema({ _id: false })
export class Media {
  @Prop({ type: Avatar })
  avatar: Avatar;

  @Prop({ type: [GalleryItem], default: [] })
  gallery: GalleryItem[];
}

// Stats subdocument
@Schema({ _id: false })
export class Stats {
  @Prop({ default: 0 })
  totalMessages: number;

  @Prop({ default: 0 })
  totalChatMinutes: number;

  @Prop()
  lastInteraction: Date;

  @Prop({ default: 0.0 })
  popularity: number;

  @Prop()
  userRating: number;
}

// Archival tracking subdocument
@Schema({ _id: false })
export class Archival {
  @Prop()
  reason: string;

  @Prop()
  archivedAt: Date;

  @Prop()
  archivedBy: string;

  @Prop({ default: true })
  preserveData: boolean;
}

// Deletion tracking subdocument
@Schema({ _id: false })
export class Deletion {
  @Prop()
  reason: string;

  @Prop()
  deletedAt: Date;

  @Prop()
  deletedBy: string;

  @Prop({ default: false })
  deleteAllData: boolean;
}

// Progress tracking subdocument
@Schema({ _id: false })
export class StepsCompleted {
  @Prop({ default: false })
  physical: boolean;

  @Prop({ default: false })
  personality: boolean;

  @Prop({ default: false })
  finalized: boolean;
}

@Schema({ _id: false })
export class Progress {
  @Prop({ type: StepsCompleted })
  stepsCompleted: StepsCompleted;

  @Prop()
  creationStarted: Date;

  @Prop()
  creationCompleted: Date;

  @Prop()
  totalCreationTime: number;
}

// Main Girlfriend schema
@Schema({ 
  timestamps: true,
  collection: 'girlfriends'
})
export class Girlfriend {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ 
    default: 'creating', 
    enum: ['creating', 'active', 'archived', 'deleted'] 
  })
  status: string;

  @Prop({ type: Creation })
  creation: Creation;

  @Prop({ type: CreationSession })
  creationSession: CreationSession;

  @Prop({ type: Basic })
  basic: Basic;

  @Prop({ type: Physical })
  physical: Physical;

  @Prop({ type: Personality })
  personality: Personality;

  @Prop({ type: AiConfig })
  aiConfig: AiConfig;

  @Prop({ type: Media })
  media: Media;

  @Prop({ type: Stats })
  stats: Stats;

  @Prop({ type: Archival })
  archival: Archival;

  @Prop({ type: Deletion })
  deletion: Deletion;

  @Prop({ type: Progress })
  progress: Progress;

  @Prop({ type: Relationship })
  relationship: Relationship;

  @Prop()
  archivedAt: Date;

  @Prop()
  deletedAt: Date;

  // Mongoose timestamps (automatically managed)
  createdAt?: Date;
  updatedAt?: Date;
}

export type GirlfriendDocument = Girlfriend & Document;
export const GirlfriendSchema = SchemaFactory.createForClass(Girlfriend);

// Enhanced Indexes for Complex Queries
GirlfriendSchema.index({ userId: 1, status: 1 });
GirlfriendSchema.index({ userId: 1, 'stats.lastInteraction': -1 });
GirlfriendSchema.index({ 'personality.personalityType': 1 });
GirlfriendSchema.index({ 'physical.bodyType': 1, 'physical.hair.color': 1 });
GirlfriendSchema.index({ 'personality.sexual.experience': 1, 'personality.sexual.libido': 1 });
GirlfriendSchema.index({ 'creation.step': 1, 'creation.createdAt': -1 });
GirlfriendSchema.index({ 'basic.age': 1, 'physical.height': 1 });
