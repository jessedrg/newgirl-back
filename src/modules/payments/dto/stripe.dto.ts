import { IsNumber, IsString, IsEmail, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStripePaymentDto {
  @ApiProperty({
    description: 'Number of chat minutes to purchase',
    example: 30,
    minimum: 1,
    maximum: 500
  })
  @IsNumber()
  @Min(1)
  @Max(500)
  quantity: number;

  @ApiProperty({
    description: 'Customer email for receipt',
    example: 'user@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}

export class StripePaymentResponseDto {
  @ApiProperty({
    description: 'Stripe payment intent ID',
    example: 'pi_1234567890abcdef'
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Client secret for frontend payment confirmation',
    example: 'pi_1234567890abcdef_secret_1234567890abcdef'
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Number of minutes being purchased',
    example: 30
  })
  quantity: number;

  @ApiProperty({
    description: 'Total amount in cents',
    example: 3000
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd'
  })
  currency: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'requires_payment_method'
  })
  status: string;
}

export class StripeWebhookDto {
  @ApiProperty({
    description: 'Stripe event type',
    example: 'payment_intent.succeeded'
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Stripe event data'
  })
  data: {
    object: any;
  };

  @ApiProperty({
    description: 'Stripe event ID',
    example: 'evt_1234567890abcdef'
  })
  @IsString()
  id: string;
}

export class StripeConfigStatusDto {
  @ApiProperty({
    description: 'Whether Stripe is configured',
    example: true
  })
  configured: boolean;

  @ApiProperty({
    description: 'Whether Stripe webhook is configured',
    example: true
  })
  webhookConfigured: boolean;

  @ApiProperty({
    description: 'Stripe publishable key for frontend',
    example: 'pk_test_1234567890abcdef'
  })
  publishableKey?: string;
}
