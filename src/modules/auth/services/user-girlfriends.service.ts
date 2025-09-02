import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../schemas/user.schema';
import { Girlfriend, GirlfriendDocument } from '../../../schemas/girlfriend.schema';

@Injectable()
export class UserGirlfriendsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Girlfriend.name) private girlfriendModel: Model<GirlfriendDocument>,
  ) {}

  async saveGirlfriend(userId: string, girlfriendId: string): Promise<{ message: string; savedGirlfriends: string[] }> {
    // Verify girlfriend exists
    const girlfriend = await this.girlfriendModel.findById(girlfriendId);
    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    // Find user and check if girlfriend is already saved
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.savedGirlfriends?.includes(girlfriendId)) {
      throw new BadRequestException('Girlfriend already saved');
    }

    // Add girlfriend to saved list
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { savedGirlfriends: girlfriendId } },
      { new: true }
    );

    return {
      message: 'Girlfriend saved successfully',
      savedGirlfriends: updatedUser.savedGirlfriends || []
    };
  }

  async unsaveGirlfriend(userId: string, girlfriendId: string): Promise<{ message: string; savedGirlfriends: string[] }> {
    // Find user and remove girlfriend from saved list
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { savedGirlfriends: girlfriendId } },
      { new: true }
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Girlfriend removed from saved list',
      savedGirlfriends: updatedUser.savedGirlfriends || []
    };
  }

  async getSavedGirlfriends(userId: string): Promise<{
    savedGirlfriends: any[];
    totalCount: number;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const savedGirlfriendIds = user.savedGirlfriends || [];
    
    // Get full girlfriend details for saved girlfriends
    const savedGirlfriends = await this.girlfriendModel.find({
      _id: { $in: savedGirlfriendIds },
      status: 'active'
    }).select('name presentationText tags gallery status createdAt');

    return {
      savedGirlfriends,
      totalCount: savedGirlfriends.length
    };
  }

  async getSavedGirlfriendIds(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('savedGirlfriends');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.savedGirlfriends || [];
  }

  async isGirlfriendSaved(userId: string, girlfriendId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('savedGirlfriends');
    if (!user) {
      return false;
    }

    return user.savedGirlfriends?.includes(girlfriendId) || false;
  }
}
