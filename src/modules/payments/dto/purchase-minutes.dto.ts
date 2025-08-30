import { IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseMinutesDto {
  @ApiProperty({ 
    description: 'Number of chat minutes to purchase',
    example: 30,
    minimum: 1,
    maximum: 500
  })
  @IsNumber()
  @Min(1, { message: 'Minimum purchase is 1 minute' })
  @Max(500, { message: 'Maximum purchase is 500 minutes at once' })
  quantity: number;

  @ApiProperty({ 
    description: 'Payment method ID from payment provider',
    example: 'pm_1234567890'
  })
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ 
    description: 'Payment provider',
    enum: ['stripe', 'paypal', 'apple_pay', 'google_pay'],
    example: 'stripe'
  })
  @IsEnum(['stripe', 'paypal', 'apple_pay', 'google_pay'])
  provider: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
}

export class PurchaseMinutesResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Transaction ID', example: 'txn_1234567890' })
  transactionId: string;

  @ApiProperty({ description: 'Minutes purchased', example: 30 })
  minutesPurchased: number;

  @ApiProperty({ description: 'Total amount paid in cents', example: 3000 })
  totalAmount: number;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Payment status', example: 'completed' })
  status: string;
}

export class MinutePricingDto {
  @ApiProperty({ description: 'Price per minute in cents', example: 100 })
  pricePerMinute: number;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Minimum purchase quantity', example: 1 })
  minQuantity: number;

  @ApiProperty({ description: 'Maximum purchase quantity', example: 500 })
  maxQuantity: number;

  @ApiProperty({ description: 'Suggested quantities for quick selection', example: [5, 10, 30, 60] })
  suggestedQuantities: number[];
}
