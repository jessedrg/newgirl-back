import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean, Min, Max, Length, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums for validation
export enum EthnicityType {
  CAUCASIAN = 'caucasian',
  ASIAN = 'asian',
  LATINA = 'latina',
  AFRICAN = 'african',
  MIXED = 'mixed',
  MIDDLE_EASTERN = 'middle_eastern'
}

export enum HairStyleType {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG_STRAIGHT = 'long_straight',
  LONG_WAVY = 'long_wavy',
  LONG_CURLY = 'long_curly',
  PIXIE = 'pixie',
  BOB = 'bob'
}

export enum HairColorType {
  BLONDE = 'blonde',
  BRUNETTE = 'brunette',
  BLACK = 'black',
  RED = 'red',
  AUBURN = 'auburn',
  SILVER = 'silver',
  PINK = 'pink',
  BLUE = 'blue'
}

export enum EyeColorType {
  BLUE = 'blue',
  BROWN = 'brown',
  GREEN = 'green',
  HAZEL = 'hazel',
  GRAY = 'gray',
  AMBER = 'amber'
}

export enum BodyType {
  PETITE = 'petite',
  SLIM = 'slim',
  ATHLETIC = 'athletic',
  CURVY = 'curvy',
  PLUS_SIZE = 'plus_size'
}

export enum SizeType {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum HeightType {
  HEIGHT_5_0 = '5_0',
  HEIGHT_5_1 = '5_1',
  HEIGHT_5_2 = '5_2',
  HEIGHT_5_3 = '5_3',
  HEIGHT_5_4 = '5_4',
  HEIGHT_5_5 = '5_5',
  HEIGHT_5_6 = '5_6',
  HEIGHT_5_7 = '5_7',
  HEIGHT_5_8 = '5_8',
  HEIGHT_5_9 = '5_9',
  HEIGHT_5_10 = '5_10'
}

export enum PersonalityType {
  CAREGIVER = 'caregiver',
  TEMPTRESS = 'temptress',
  DOMINANT = 'dominant',
  GIRL_NEXT_DOOR = 'girl_next_door',
  MYSTERIOUS = 'mysterious',
  ADVENTUROUS = 'adventurous',
  INTELLECTUAL = 'intellectual',
  CREATIVE = 'creative'
}

export enum SpeakingStyle {
  WARM = 'warm',
  PLAYFUL = 'playful',
  SOPHISTICATED = 'sophisticated',
  CASUAL = 'casual',
  PASSIONATE = 'passionate',
  GENTLE = 'gentle'
}

export enum RelationshipStyle {
  DEVOTED = 'devoted',
  INDEPENDENT = 'independent',
  CLINGY = 'clingy',
  SUPPORTIVE = 'supportive',
  CHALLENGING = 'challenging'
}

// Step 1: Basic Information DTO
export class CreateGirlfriendBasicDto {
  @ApiProperty({ example: 'Emma', description: 'Girlfriend name' })
  @IsString()
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  name: string;

  @ApiProperty({ example: 25, description: 'Age between 18-99' })
  @IsNumber()
  @Min(18, { message: 'Age must be at least 18' })
  @Max(99, { message: 'Age must be less than 100' })
  age: number;

  @ApiProperty({ 
    example: 'A sweet and caring girlfriend who loves cozy evenings and deep conversations.',
    description: 'Brief description of the girlfriend'
  })
  @IsString()
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;
}

// Step 2: Physical Attributes DTO
export class UpdateGirlfriendPhysicalDto {
  @ApiProperty({ enum: EthnicityType, example: EthnicityType.CAUCASIAN })
  @IsEnum(EthnicityType)
  ethnicity: EthnicityType;

  @ApiProperty({ enum: HairStyleType, example: HairStyleType.LONG_WAVY })
  @IsEnum(HairStyleType)
  hairStyle: HairStyleType;

  @ApiProperty({ enum: HairColorType, example: HairColorType.BLONDE })
  @IsEnum(HairColorType)
  hairColor: HairColorType;

  @ApiProperty({ enum: EyeColorType, example: EyeColorType.BLUE })
  @IsEnum(EyeColorType)
  eyeColor: EyeColorType;

  @ApiProperty({ enum: BodyType, example: BodyType.ATHLETIC })
  @IsEnum(BodyType)
  bodyType: BodyType;

  @ApiProperty({ enum: SizeType, example: SizeType.MEDIUM })
  @IsEnum(SizeType)
  breastSize: SizeType;

  @ApiProperty({ enum: SizeType, example: SizeType.MEDIUM })
  @IsEnum(SizeType)
  buttSize: SizeType;

  @ApiProperty({ enum: HeightType, example: HeightType.HEIGHT_5_6 })
  @IsEnum(HeightType)
  height: HeightType;

  @ApiProperty({ example: 'fair', description: 'Skin tone' })
  @IsString()
  @IsIn(['fair', 'light', 'medium', 'olive', 'tan', 'dark'])
  skinTone: string;

  @ApiPropertyOptional({ 
    type: 'object',
    example: {
      fashion: 'casual_chic',
      makeup: 'natural',
      accessories: ['earrings', 'watch']
    }
  })
  @IsOptional()
  style?: {
    fashion: string;
    makeup: string;
    accessories: string[];
  };
}

// Step 3: Personality Configuration DTO
export class UpdateGirlfriendPersonalityDto {
  @ApiProperty({ enum: PersonalityType, example: PersonalityType.CAREGIVER })
  @IsEnum(PersonalityType)
  type: PersonalityType;

  @ApiProperty({ 
    type: [String],
    example: ['nurturing', 'empathetic', 'supportive', 'romantic', 'patient'],
    description: 'Array of personality traits'
  })
  @IsArray()
  @IsString({ each: true })
  traits: string[];

  @ApiProperty({ enum: SpeakingStyle, example: SpeakingStyle.WARM })
  @IsEnum(SpeakingStyle)
  speakingStyle: SpeakingStyle;

  @ApiProperty({ 
    type: [String],
    example: ['cooking', 'reading', 'yoga', 'movies', 'travel'],
    description: 'Array of interests'
  })
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @ApiProperty({ enum: RelationshipStyle, example: RelationshipStyle.DEVOTED })
  @IsEnum(RelationshipStyle)
  relationshipStyle: RelationshipStyle;

  @ApiProperty({ 
    example: 7,
    description: 'Intimacy level from 1-10',
    minimum: 1,
    maximum: 10
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  intimacyLevel: number;

  @ApiPropertyOptional({ 
    type: [String],
    example: ['loves_morning_coffee', 'hums_while_cooking', 'collects_books'],
    description: 'Unique quirks and habits'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quirks?: string[];
}

// Step 4: Finalization DTO
export class FinalizeGirlfriendDto {
  @ApiProperty({ example: true, description: 'Confirm creation' })
  @IsBoolean()
  confirmCreation: boolean;

  @ApiProperty({ example: true, description: 'Generate AI avatar' })
  @IsBoolean()
  generateAvatar: boolean;

  @ApiPropertyOptional({ example: false, description: 'Start chat immediately' })
  @IsOptional()
  @IsBoolean()
  startChat?: boolean;
}

// Avatar Generation DTO
export class GenerateAvatarDto {
  @ApiPropertyOptional({ example: 'realistic', description: 'Image style' })
  @IsOptional()
  @IsString()
  @IsIn(['realistic', 'anime', 'artistic', 'photographic'])
  style?: string;

  @ApiPropertyOptional({ 
    example: 'portrait of beautiful woman with blonde wavy hair and blue eyes',
    description: 'Custom prompt for generation'
  })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  prompt?: string;

  @ApiPropertyOptional({ example: '1:1', description: 'Aspect ratio' })
  @IsOptional()
  @IsString()
  @IsIn(['1:1', '3:4', '4:3', '16:9'])
  aspectRatio?: string;

  @ApiPropertyOptional({ example: 'hd', description: 'Image quality' })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'hd', 'ultra'])
  quality?: string;
}

// Gallery Generation DTO
export class GenerateGalleryDto {
  @ApiProperty({ 
    example: 'full body photo in casual summer dress',
    description: 'Generation prompt'
  })
  @IsString()
  @Length(10, 200)
  prompt: string;

  @ApiPropertyOptional({ example: 'realistic', description: 'Image style' })
  @IsOptional()
  @IsString()
  @IsIn(['realistic', 'anime', 'artistic', 'photographic'])
  style?: string;

  @ApiPropertyOptional({ example: 'park', description: 'Setting/background' })
  @IsOptional()
  @IsString()
  setting?: string;

  @ApiPropertyOptional({ example: 2, description: 'Number of images to generate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  quantity?: number;
}

// Update Girlfriend DTO (for post-creation edits)
export class UpdateGirlfriendDto {
  @ApiPropertyOptional({ example: 'Emma Rose', description: 'Updated name' })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  name?: string;

  @ApiPropertyOptional({ 
    example: 'Updated description with new details...',
    description: 'Updated description'
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  description?: string;

  @ApiPropertyOptional({ 
    type: 'object',
    description: 'Personality updates'
  })
  @IsOptional()
  personality?: {
    interests?: string[];
    intimacyLevel?: number;
    quirks?: string[];
  };
}

// Archive Girlfriend DTO
export class ArchiveGirlfriendDto {
  @ApiProperty({ 
    example: 'taking_break',
    description: 'Reason for archiving'
  })
  @IsString()
  @IsIn(['taking_break', 'not_satisfied', 'temporary_pause', 'other'])
  reason: string;

  @ApiPropertyOptional({ example: true, description: 'Preserve all data' })
  @IsOptional()
  @IsBoolean()
  preserveData?: boolean;
}

// Delete Girlfriend DTO
export class DeleteGirlfriendDto {
  @ApiProperty({ example: true, description: 'Confirm permanent deletion' })
  @IsBoolean()
  confirmDeletion: boolean;

  @ApiProperty({ example: true, description: 'Delete all associated data' })
  @IsBoolean()
  deleteAllData: boolean;

  @ApiPropertyOptional({ 
    example: 'no_longer_needed',
    description: 'Reason for deletion'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTOs
export class GirlfriendProgressDto {
  @ApiProperty({ example: 1, description: 'Current step number' })
  currentStep: number;

  @ApiProperty({ example: [1], description: 'Completed steps' })
  completedSteps: number[];

  @ApiProperty({ example: '/physical', description: 'Next step path' })
  nextStep: string;

  @ApiProperty({ example: 4, description: 'Total steps' })
  totalSteps: number;
}

export class CreateGirlfriendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    girlfriendId: string;
    sessionToken: string;
    progress: GirlfriendProgressDto;
  };
}

export class GirlfriendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    id: string;
    name: string;
    status: string;
    basic?: any;
    physical?: any;
    personality?: any;
    media?: any;
    relationship?: any;
    createdAt: string;
    updatedAt: string;
  };
}

export class GirlfriendListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    girlfriends: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      totalActive: number;
      totalArchived: number;
      subscriptionLimit: number;
    };
  };
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ type: 'object' })
  error: {
    code: string;
    message: string;
    [key: string]: any;
  };
}
