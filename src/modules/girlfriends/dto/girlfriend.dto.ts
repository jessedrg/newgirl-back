import { ApiProperty } from '@nestjs/swagger';

export class GirlfriendDto {
  @ApiProperty({ description: 'Unique identifier of the girlfriend' })
  id: string;

  @ApiProperty({ description: 'Name of the girlfriend', example: 'Emma' })
  name: string;

  @ApiProperty({ description: 'Presentation text describing the girlfriend' })
  presentationText: string;

  @ApiProperty({ 
    description: 'Tags representing what she likes/interests',
    type: [String],
    example: ['music', 'travel', 'cooking', 'fitness']
  })
  tags: string[];

  @ApiProperty({ 
    description: 'Gallery of images',
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  })
  gallery: string[];
}
