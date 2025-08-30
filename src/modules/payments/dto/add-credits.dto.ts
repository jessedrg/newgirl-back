import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCreditsDto {
  @ApiProperty({ description: 'User ID to add credits to', example: '507f1f77bcf86cd799439011' })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Type of credits to add',
    enum: ['chat_minutes', 'image_credits', 'tip_credits'],
    example: 'chat_minutes'
  })
  @IsEnum(['chat_minutes', 'image_credits', 'tip_credits'])
  creditType: 'chat_minutes' | 'image_credits' | 'tip_credits';

  @ApiProperty({ 
    description: 'Amount of credits to add',
    example: 60,
    minimum: 1,
    maximum: 10000
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Reason for adding credits',
    example: 'Manual admin credit addition'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ 
    description: 'Admin user ID who added the credits',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsString()
  adminUserId?: string;
}

export class AddCreditsResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Message', example: 'Credits added successfully' })
  message: string;

  @ApiProperty({ description: 'Updated wallet balance' })
  wallet: {
    chatMinutes: number;
    imageCredits: number;
    tipCredits: number;
  };

  @ApiProperty({ description: 'Credits added in this operation' })
  creditsAdded: {
    type: string;
    amount: number;
  };
}
