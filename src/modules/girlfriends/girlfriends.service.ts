import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Girlfriend, GirlfriendDocument } from '../../schemas/girlfriend.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { 
  CreateGirlfriendBasicDto,
  UpdateGirlfriendPhysicalDto,
  UpdateGirlfriendPersonalityDto,
  FinalizeGirlfriendDto,
  UpdateGirlfriendDto,
  ArchiveGirlfriendDto,
  DeleteGirlfriendDto,
  GenerateAvatarDto,
  GenerateGalleryDto
} from './dto/girlfriend.dto';

@Injectable()
export class GirlfriendsService {
  constructor(
    @InjectModel(Girlfriend.name) private girlfriendModel: Model<GirlfriendDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Step 1: Create basic girlfriend information
  async createBasic(userId: string, createDto: CreateGirlfriendBasicDto) {
    // Validate subscription limits
    await this.validateGirlfriendCreation(userId);

    // Check for duplicate names for this user
    const existingGirlfriend = await this.girlfriendModel.findOne({
      userId,
      'basic.name': createDto.name,
      deletedAt: { $exists: false }
    });

    if (existingGirlfriend) {
      throw new ConflictException('A girlfriend with this name already exists');
    }

    // Generate session token for creation process
    const sessionToken = uuidv4();
    const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create girlfriend document
    const girlfriend = new this.girlfriendModel({
      userId,
      basic: {
        name: createDto.name,
        age: createDto.age,
        description: createDto.description
      },
      status: 'creating',
      creationSession: {
        token: sessionToken,
        expiresAt: sessionExpiry,
        currentStep: 1,
        completedSteps: [1]
      },
      progress: {
        creationStarted: new Date(),
        stepsCompleted: {
          basic: true,
          physical: false,
          personality: false,
          finalized: false
        }
      }
    });

    await girlfriend.save();

    // Track creation start
    await this.trackGirlfriendCreationStart(userId, girlfriend._id.toString());

    return {
      success: true,
      data: {
        girlfriendId: girlfriend._id.toString(),
        sessionToken,
        progress: {
          currentStep: 1,
          completedSteps: [1],
          nextStep: '/physical',
          totalSteps: 4
        }
      }
    };
  }

  // Step 2: Update physical attributes
  async updatePhysical(userId: string, girlfriendId: string, updateDto: UpdateGirlfriendPhysicalDto, sessionToken?: string) {
    const girlfriend = await this.validateCreationSession(userId, girlfriendId, sessionToken, 2);

    // Update physical attributes
    girlfriend.physical = {
      height: updateDto.height,
      weight: 'average',
      ethnicity: updateDto.ethnicity || 'caucasian',
      bodyType: updateDto.bodyType,
      breastSize: updateDto.breastSize,
      breastShape: 'round',
      buttSize: updateDto.buttSize,
      buttShape: 'round',
      waistSize: 'medium',
      hipSize: 'medium',
      face: {
        shape: 'oval',
        eyeColor: updateDto.eyeColor,
        color: updateDto.eyeColor,
        eyeShape: 'almond',
        eyeSize: 'medium',
        eyebrowStyle: 'medium',
        noseShape: 'straight',
        lipShape: 'medium',
        lipSize: 'medium',
        cheekbones: 'medium',
        jawline: 'soft',
        chinShape: 'round',
        dimples: false,
        freckles: false
      },
      eyes: {
        shape: 'oval',
        eyeColor: updateDto.eyeColor,
        color: updateDto.eyeColor,
        eyeShape: 'almond',
        eyeSize: 'medium',
        eyebrowStyle: 'medium',
        noseShape: 'straight',
        lipShape: 'medium',
        lipSize: 'medium',
        cheekbones: 'medium',
        jawline: 'soft',
        chinShape: 'round',
        dimples: false,
        freckles: false
      },
      hair: {
        style: updateDto.hairStyle,
        color: updateDto.hairColor,
        length: 'medium',
        highlights: '',
        texture: 'straight',
        bangs: false,
        bangStyle: ''
      },
      skin: {
        tone: updateDto.skinTone || 'medium',
        undertone: 'neutral',
        texture: 'smooth',
        blemishes: false,
        freckles: false,
        moles: false,
        scars: []
      },
      legs: {
        length: 'average',
        shape: 'athletic',
        thighGap: false
      },
      arms: {
        length: 'average',
        muscleTone: 'toned'
      },
      intimate: {
        pubicHair: 'trimmed',
        nippleSize: 'medium',
        nippleColor: 'pink',
        sensitivity: 'medium'
      },
      modifications: {
        piercings: [],
        tattoos: [],
        surgeries: []
      },
      style: {
        fashion: 'casual',
        makeup: 'natural',
        nails: 'short',
        nailColor: 'natural',
        accessories: [],
        preferredColors: []
      }
    };

    // Update progress
    girlfriend.creationSession.currentStep = 2;
    girlfriend.creationSession.completedSteps.push(2);
    girlfriend.progress.stepsCompleted.physical = true;

    await girlfriend.save();

    // Start avatar preview generation (async)
    const previewJob = await this.startAvatarPreviewGeneration(girlfriend);

    return {
      success: true,
      data: {
        progress: {
          currentStep: 2,
          completedSteps: [1, 2],
          nextStep: '/personality'
        },
        previewGeneration: {
          jobId: previewJob.id,
          estimatedTime: 30
        }
      }
    };
  }

  // Step 3: Update personality configuration
  async updatePersonality(userId: string, girlfriendId: string, updateDto: UpdateGirlfriendPersonalityDto, sessionToken?: string) {
    const girlfriend = await this.validateCreationSession(userId, girlfriendId, sessionToken, 3);

    // Update personality
    girlfriend.personality = {
      personalityType: updateDto.type,
      type: updateDto.type,
      traits: {
        dominance: 5,
        extroversion: 5,
        agreeableness: 5,
        openness: 5,
        conscientiousness: 5,
        neuroticism: 5,
        adventurousness: 5,
        confidence: 5,
        empathy: 5,
        humor: 5,
        intelligence: 5,
        playfulness: 5,
        jealousy: 5
      },
      communication: {
        speakingStyle: updateDto.speakingStyle,
        style: updateDto.speakingStyle,
        tone: this.getSpeakingTone(updateDto.speakingStyle),
        vocabulary: 'average',
        humor: 'playful',
        emotionalExpression: 'moderate',
        flirtingStyle: 'playful',
        textingStyle: 'casual'
      },
      interests: {
        hobbies: Array.isArray(updateDto.interests) ? updateDto.interests : [],
        music: [],
        movies: [],
        books: [],
        food: [],
        activities: []
      },
      sexual: {
        experience: 'some_experience',
        libido: 5,
        initiative: 5,
        adventurousness: 5,
        dominance: 5,
        preferences: {
          roleplay: false,
          roughness: 'moderate',
          pace: 'moderate',
          positions: [],
          locations: [],
          timeOfDay: [],
          frequency: 'weekly'
        },
        kinks: [],
        boundaries: [],
        turnOns: [],
        turnOffs: [],
        submissiveTraits: {
          obedience: 5,
          bratiness: 5,
          needsApproval: 5,
          followsOrders: 5,
          punishment: [],
          rewards: []
        },
        dominantTraits: {
          control: 5,
          strictness: 5,
          nurturing: 5,
          commands: [],
          punishments: [],
          rewards: []
        }
      },
      relationship: {
        type: updateDto.relationshipStyle || 'girlfriend',
        style: updateDto.relationshipStyle || 'girlfriend',
        intimacyLevel: updateDto.intimacyLevel || 5,
        affectionLevel: 5,
        possessiveness: 5,
        neediness: 5,
        loyalty: 5,
        loveLanguages: [],
        conflictStyle: 'mature',
        attachmentStyle: 'secure'
      },
      quirks: updateDto.quirks || [],
      fears: [],
      dreams: [],
      secrets: []
    };

    // Update progress
    girlfriend.creationSession.currentStep = 3;
    girlfriend.creationSession.completedSteps.push(3);
    girlfriend.progress.stepsCompleted.personality = true;

    await girlfriend.save();

    // Generate personality scores and system prompt preview
    const personalityAnalysis = await this.analyzePersonality(girlfriend);
    const systemPromptPreview = await this.generateSystemPromptPreview(girlfriend);

    return {
      success: true,
      data: {
        progress: {
          currentStep: 3,
          completedSteps: [1, 2, 3],
          nextStep: '/finalize'
        },
        personalityScore: personalityAnalysis,
        systemPromptPreview
      }
    };
  }

  // Step 4: Finalize girlfriend creation
  async finalize(userId: string, girlfriendId: string, finalizeDto: FinalizeGirlfriendDto, sessionToken?: string) {
    const girlfriend = await this.validateCreationSession(userId, girlfriendId, sessionToken, 4);

    if (!finalizeDto.confirmCreation) {
      throw new BadRequestException('Creation confirmation required');
    }

    // Validate all steps completed
    const requiredSteps = [1, 2, 3];
    const missingSteps = requiredSteps.filter(step => !girlfriend.creationSession.completedSteps.includes(step));
    
    if (missingSteps.length > 0) {
      throw new BadRequestException(`Missing required steps: ${missingSteps.join(', ')}`);
    }

    // Generate AI configuration
    const aiConfig = await this.generateAIConfiguration(girlfriend);
    girlfriend.aiConfig = aiConfig;

    // Generate avatar if requested
    let avatarData = null;
    if (finalizeDto.generateAvatar) {
      avatarData = await this.generateFinalAvatar(girlfriend);
      girlfriend.media.avatar = avatarData;
    }

    // Update status and finalize
    girlfriend.status = 'active';
    girlfriend.progress.stepsCompleted.finalized = true;
    girlfriend.progress.creationCompleted = new Date();
    girlfriend.progress.totalCreationTime = Date.now() - girlfriend.progress.creationStarted.getTime();
    
    // Clear creation session
    girlfriend.creationSession = undefined;

    // Initialize relationship data
    girlfriend.relationship = {
      type: 'girlfriend',
      style: 'girlfriend',
      intimacyLevel: 5,
      affectionLevel: 5,
      possessiveness: 5,
      neediness: 5,
      loyalty: 5,
      loveLanguages: [],
      conflictStyle: 'mature',
      attachmentStyle: 'secure'
    };

    await girlfriend.save();

    // Track successful creation
    await this.trackGirlfriendCreationComplete(userId, girlfriendId);

    // Initialize chat if requested
    let chatData = null;
    if (finalizeDto.startChat) {
      chatData = await this.initializeChat(girlfriend);
    }

    return {
      success: true,
      data: {
        girlfriend: {
          id: girlfriend._id.toString(),
          name: girlfriend.basic.name,
          status: girlfriend.status,
          avatar: avatarData
        },
        completion: {
          createdAt: girlfriend.progress.creationCompleted,
          totalCreationTime: girlfriend.progress.totalCreationTime,
          sessionClosed: true
        },
        nextActions: {
          startChat: chatData ? `/chat/${girlfriend._id}` : `/chat/${girlfriend._id}`,
          customizeMore: `/girlfriends/${girlfriend._id}/edit`
        }
      }
    };
  }

  // Get girlfriend details
  async getGirlfriend(userId: string, girlfriendId: string) {
    const girlfriend = await this.girlfriendModel.findOne({
      _id: girlfriendId,
      userId,
      deletedAt: { $exists: false }
    });

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    return {
      success: true,
      data: {
        id: girlfriend._id.toString(),
        name: girlfriend.basic?.name,
        status: girlfriend.status,
        basic: girlfriend.basic,
        physical: girlfriend.physical,
        personality: girlfriend.personality,
        media: girlfriend.media,
        relationship: girlfriend.relationship,
        createdAt: girlfriend.createdAt?.toISOString(),
        updatedAt: girlfriend.updatedAt?.toISOString()
      }
    };
  }

  // List user's girlfriends
  async listGirlfriends(userId: string, status?: string, sortBy = 'created', limit = 20, offset = 0) {
    const query: any = {
      userId,
      deletedAt: { $exists: false }
    };

    if (status) {
      query.status = status;
    }

    const sortOptions: any = {};
    switch (sortBy) {
      case 'lastInteraction':
        sortOptions['relationship.lastInteraction'] = -1;
        break;
      case 'name':
        sortOptions['basic.name'] = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const [girlfriends, total] = await Promise.all([
      this.girlfriendModel
        .find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(offset)
        .select('basic.name media.avatar personality.type relationship status createdAt')
        .exec(),
      this.girlfriendModel.countDocuments(query)
    ]);

    // Get summary statistics
    const [totalActive, totalArchived] = await Promise.all([
      this.girlfriendModel.countDocuments({ userId, status: 'active', deletedAt: { $exists: false } }),
      this.girlfriendModel.countDocuments({ userId, status: 'archived', deletedAt: { $exists: false } })
    ]);

    const user = await this.userModel.findById(userId);
    const subscriptionLimit = this.getGirlfriendLimit(user?.subscription?.plan || 'free');

    return {
      success: true,
      data: {
        girlfriends: girlfriends.map(gf => ({
          id: gf._id.toString(),
          name: gf.basic?.name,
          avatar: gf.media?.avatar,
          personality: { type: gf.personality?.type },
          relationship: gf.relationship,
          status: gf.status,
          createdAt: gf.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        summary: {
          totalActive,
          totalArchived,
          subscriptionLimit
        }
      }
    };
  }

  // Update girlfriend (post-creation)
  async updateGirlfriend(userId: string, girlfriendId: string, updateDto: UpdateGirlfriendDto) {
    const girlfriend = await this.girlfriendModel.findOne({
      _id: girlfriendId,
      userId,
      status: 'active',
      deletedAt: { $exists: false }
    });

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found or not active');
    }

    // Update allowed fields
    if (updateDto.name) {
      // Check for duplicate names
      const existingGirlfriend = await this.girlfriendModel.findOne({
        userId,
        'basic.name': updateDto.name,
        _id: { $ne: girlfriendId },
        deletedAt: { $exists: false }
      });

      if (existingGirlfriend) {
        throw new ConflictException('A girlfriend with this name already exists');
      }

      girlfriend.basic.name = updateDto.name;
    }

    if (updateDto.description) {
      girlfriend.basic.description = updateDto.description;
    }

    if (updateDto.personality) {
      if (updateDto.personality.interests) {
        girlfriend.personality.interests = {
          hobbies: Array.isArray(updateDto.personality.interests) ? updateDto.personality.interests : [],
          music: [],
          movies: [],
          books: [],
          food: [],
          activities: []
        };
      }
      if (updateDto.personality.intimacyLevel) {
        girlfriend.personality.relationship.intimacyLevel = updateDto.personality.intimacyLevel;
      }
      if (updateDto.personality.quirks) {
        girlfriend.personality.quirks = updateDto.personality.quirks;
      }
    }

    await girlfriend.save();

    return {
      success: true,
      data: {
        id: girlfriend._id.toString(),
        message: 'Girlfriend updated successfully'
      }
    };
  }

  // Archive girlfriend
  async archiveGirlfriend(userId: string, girlfriendId: string, archiveDto: ArchiveGirlfriendDto) {
    const girlfriend = await this.girlfriendModel.findOne({
      _id: girlfriendId,
      userId,
      status: 'active',
      deletedAt: { $exists: false }
    });

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found or not active');
    }

    girlfriend.status = 'archived';
    girlfriend.archival = {
      archivedAt: new Date(),
      reason: archiveDto.reason,
      preserveData: archiveDto.preserveData ?? true,
      archivedBy: 'system' // or get from user context
    };

    await girlfriend.save();

    // Update user's active girlfriend count
    await this.updateGirlfriendCount(userId, -1);

    return {
      success: true,
      data: {
        id: girlfriend._id.toString(),
        message: 'Girlfriend archived successfully'
      }
    };
  }

  // Delete girlfriend permanently
  async deleteGirlfriend(userId: string, girlfriendId: string, deleteDto: DeleteGirlfriendDto) {
    if (!deleteDto.confirmDeletion) {
      throw new BadRequestException('Deletion confirmation required');
    }

    const girlfriend = await this.girlfriendModel.findOne({
      _id: girlfriendId,
      userId,
      deletedAt: { $exists: false }
    });

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    if (deleteDto.deleteAllData) {
      // TODO: Delete associated data (messages, images, etc.)
      await this.deleteAssociatedData(girlfriendId);
    }

    // Soft delete
    girlfriend.deletedAt = new Date();
    girlfriend.deletion = {
      deletedBy: userId,
      reason: deleteDto.reason,
      deleteAllData: deleteDto.deleteAllData,
      deletedAt: new Date()
    };

    await girlfriend.save();

    // Update user's girlfriend count if was active
    if (girlfriend.status === 'active') {
      await this.updateGirlfriendCount(userId, -1);
    }

    return {
      success: true,
      data: {
        id: girlfriend._id.toString(),
        message: 'Girlfriend deleted successfully'
      }
    };
  }

  // Private helper methods
  private async validateGirlfriendCreation(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check subscription limits
    const currentCount = await this.girlfriendModel.countDocuments({
      userId,
      status: 'active',
      deletedAt: { $exists: false }
    });

    const limit = this.getGirlfriendLimit(user.subscription?.plan || 'free');
    
    if (limit !== -1 && currentCount >= limit) {
      throw new ForbiddenException({
        code: 'GIRLFRIEND_LIMIT_REACHED',
        message: 'You have reached the maximum number of girlfriends for your subscription tier',
        currentCount,
        limit,
        upgradeRequired: true
      });
    }

    // TODO: Check rate limits
    // await this.checkRateLimit(userId, 'create_girlfriend');
  }

  private async validateCreationSession(userId: string, girlfriendId: string, sessionToken: string, requiredStep: number) {
    const girlfriend = await this.girlfriendModel.findOne({
      _id: girlfriendId,
      userId,
      status: 'creating',
      deletedAt: { $exists: false }
    });

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend creation session not found');
    }

    // Validate session token
    if (girlfriend.creationSession?.token !== sessionToken) {
      throw new BadRequestException('Invalid session token');
    }

    // Check session expiry
    if (girlfriend.creationSession?.expiresAt < new Date()) {
      throw new BadRequestException('Creation session has expired');
    }

    // Validate step progression
    const currentStep = girlfriend.creationSession.currentStep;
    if (requiredStep > currentStep + 1) {
      throw new BadRequestException({
        code: 'INVALID_CREATION_STEP',
        message: `Cannot skip to step ${requiredStep} without completing step ${currentStep + 1}`,
        currentStep,
        requiredStep: currentStep + 1
      });
    }

    return girlfriend;
  }

  private getGirlfriendLimit(plan: string): number {
    const limits = {
      free: 1,
      trial: 3,
      premium: -1, // unlimited
      enterprise: -1 // unlimited
    };
    return limits[plan] || 1;
  }

  private getSpeakingTone(style: string): string {
    const tones = {
      warm: 'caring and affectionate',
      playful: 'light-hearted and fun',
      sophisticated: 'elegant and refined',
      casual: 'relaxed and informal',
      passionate: 'intense and emotional',
      gentle: 'soft and soothing'
    };
    return tones[style] || 'natural and engaging';
  }

  private generateBackstory(personalityDto: UpdateGirlfriendPersonalityDto): string {
    // TODO: Generate AI-powered backstory based on personality
    return `A ${personalityDto.type} personality with interests in ${personalityDto.interests.join(', ')}.`;
  }

  private async analyzePersonality(girlfriend: GirlfriendDocument) {
    // TODO: Implement personality analysis algorithm
    return {
      compatibility: 0.92,
      uniqueness: 0.78,
      engagement: 0.85
    };
  }

  private async generateSystemPromptPreview(girlfriend: GirlfriendDocument): Promise<string> {
    // TODO: Generate comprehensive system prompt
    return `You are ${girlfriend.basic.name}, a ${girlfriend.basic.age}-year-old ${girlfriend.personality.type} girlfriend...`;
  }

  private async generateAIConfiguration(girlfriend: GirlfriendDocument) {
    // TODO: Generate comprehensive AI configuration
    return {
      responseStyle: {
        length: 'medium',
        formality: 'casual',
        emotiveness: 'moderate',
        flirtiness: 5,
        sexualness: 5
      },
      memory: {
        rememberConversations: true,
        adaptToUser: true,
        learnPreferences: true,
        personalityEvolution: false
      },
      contentFilters: {
        nsfwLevel: 3,
        violenceLevel: 1,
        profanityLevel: 2,
        tabooTopics: []
      },
      conversationStarters: [
        `Hi! I'm ${girlfriend.name}. How are you doing today?`,
        "What's on your mind?",
        "Tell me about your day!"
      ],
      voice: {
        provider: 'elevenlabs',
        voiceId: 'default',
        speed: 1.0,
        pitch: 0,
        emotion: 'happy',
        accent: 'american'
      },
      systemPrompt: await this.generateSystemPromptPreview(girlfriend),
      temperature: 0.8,
      maxTokens: 2048,
      memoryEnabled: true,
      emotionDetection: true
    };
  }

  private async startAvatarPreviewGeneration(girlfriend: GirlfriendDocument) {
    // TODO: Integrate with image generation service
    return { id: `preview_${Date.now()}`, status: 'generating' };
  }

  private async generateFinalAvatar(girlfriend: GirlfriendDocument) {
    // TODO: Generate final avatar using AI image generation
    return {
      url: `https://cdn.newgirl.com/avatars/${girlfriend._id}_final.jpg`,
      thumbnailUrl: `https://cdn.newgirl.com/avatars/${girlfriend._id}_thumb.jpg`,
      generatedAt: new Date()
    };
  }

  private async initializeChat(girlfriend: GirlfriendDocument) {
    // TODO: Initialize chat conversation
    return {
      chatId: `chat_${girlfriend._id}`,
      welcomeMessage: `Hi! I'm ${girlfriend.basic.name}. I'm so excited to get to know you better!`
    };
  }

  private async trackGirlfriendCreationStart(userId: string, girlfriendId: string) {
    // TODO: Track creation start in analytics
    console.log(`Girlfriend creation started: ${userId} -> ${girlfriendId}`);
  }

  private async trackGirlfriendCreationComplete(userId: string, girlfriendId: string) {
    // TODO: Track successful creation and update counters
    await this.updateGirlfriendCount(userId, 1);
    console.log(`Girlfriend creation completed: ${userId} -> ${girlfriendId}`);
  }

  private async updateGirlfriendCount(userId: string, delta: number) {
    // TODO: Update Redis counters and usage tracking
    console.log(`Updating girlfriend count for ${userId}: ${delta}`);
  }

  private async deleteAssociatedData(girlfriendId: string) {
    // TODO: Delete messages, images, and other associated data
    console.log(`Deleting associated data for girlfriend: ${girlfriendId}`);
  }
}
