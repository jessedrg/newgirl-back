import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Girlfriend, GirlfriendDocument } from '../../schemas/girlfriend.schema';
import { GirlfriendDto } from './dto/girlfriend.dto';

@Injectable()
export class GirlfriendsService {
  constructor(
    @InjectModel(Girlfriend.name) private girlfriendModel: Model<GirlfriendDocument>,
  ) {}

  async findAll(limit = 20, offset = 0, tags?: string[]): Promise<GirlfriendDto[]> {
    const query: any = { status: 'active' };
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const girlfriends = await this.girlfriendModel
      .find(query)
      .select('_id name presentationText tags gallery')
      .limit(limit)
      .skip(offset)
      .exec();

    return girlfriends.map(girlfriend => ({
      id: girlfriend._id.toString(),
      name: girlfriend.name || '',
      presentationText: girlfriend.presentationText || '',
      tags: girlfriend.tags || [],
      gallery: girlfriend.gallery || []
    }));
  }

  async findById(id: string): Promise<GirlfriendDto> {
    const girlfriend = await this.girlfriendModel
      .findById(id)
      .select('_id name presentationText tags gallery')
      .exec();

    if (!girlfriend) {
      throw new NotFoundException('Girlfriend not found');
    }

    return {
      id: girlfriend._id.toString(),
      name: girlfriend.name || '',
      presentationText: girlfriend.presentationText || '',
      tags: girlfriend.tags || [],
      gallery: girlfriend.gallery || []
    };
  }
}
