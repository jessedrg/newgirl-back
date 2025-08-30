import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanPricingDto {
  @ApiProperty({ description: 'Price in cents (e.g., 999 = $9.99)', example: 999 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsString()
  currency: string = 'USD';

  @ApiProperty({ 
    description: 'Payment type', 
    enum: ['one-time', 'monthly', 'yearly'],
    example: 'one-time'
  })
  @IsEnum(['one-time', 'monthly', 'yearly'])
  type: string;
}

export class PlanFeaturesDto {
  @ApiProperty({ description: 'Chat minutes included', example: 60, minimum: 0 })
  @IsNumber()
  @Min(0)
  chatMinutes: number;

  @ApiProperty({ description: 'Image credits included', example: 10, minimum: 0 })
  @IsNumber()
  @Min(0)
  imageCredits: number;

  @ApiProperty({ description: 'Tip credits included', example: 5, minimum: 0 })
  @IsNumber()
  @Min(0)
  tipCredits: number;

  @ApiProperty({ description: 'Unlimited chat feature', example: false, default: false })
  @IsBoolean()
  unlimitedChat: boolean = false;
}

export class CreatePaymentPlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Starter Pack' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plan description', example: 'Perfect for getting started with AI companions' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Pricing information', type: PlanPricingDto })
  @ValidateNested()
  @Type(() => PlanPricingDto)
  pricing: PlanPricingDto;

  @ApiProperty({ description: 'Plan features', type: PlanFeaturesDto })
  @ValidateNested()
  @Type(() => PlanFeaturesDto)
  features: PlanFeaturesDto;

  @ApiPropertyOptional({ description: 'Whether plan is active', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({ description: 'Mark as popular choice', default: false })
  @IsOptional()
  @IsBoolean()
  popular?: boolean = false;

  @ApiPropertyOptional({ description: 'Display order', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  displayOrder?: number = 1;

  @ApiPropertyOptional({ description: 'Stripe product ID' })
  @IsOptional()
  @IsString()
  stripeProductId?: string;

  @ApiPropertyOptional({ description: 'Stripe price ID' })
  @IsOptional()
  @IsString()
  stripePriceId?: string;
}
