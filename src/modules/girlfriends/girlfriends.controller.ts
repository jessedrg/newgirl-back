import { 
  Controller, 
  Get, 
  Param, 
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GirlfriendsService } from './girlfriends.service';
import { GirlfriendDto } from './dto/girlfriend.dto';

@ApiTags('girlfriends')
@Controller('girlfriends')
export class GirlfriendsController {
  constructor(private readonly girlfriendsService: GirlfriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available girlfriends' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of girlfriends retrieved successfully',
    type: [GirlfriendDto]
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of girlfriends to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of girlfriends to skip' })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Filter by tags (comma-separated)' })
  async getAllGirlfriends(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('tags') tags?: string
  ): Promise<GirlfriendDto[]> {
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : undefined;
    return this.girlfriendsService.findAll(limit, offset, tagArray);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific girlfriend by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Girlfriend retrieved successfully',
    type: GirlfriendDto
  })
  @ApiResponse({ status: 404, description: 'Girlfriend not found' })
  async getGirlfriendById(@Param('id') id: string): Promise<GirlfriendDto> {
    return this.girlfriendsService.findById(id);
  }
}
