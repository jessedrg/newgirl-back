import { IsString, IsNumber, IsOptional, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Confirmo Invoice Creation DTOs
export class CreateConfirmoInvoiceDto {
  @ApiProperty({ description: 'Invoice amount', example: 30.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Original currency code', example: 'USD' })
  @IsString()
  currencyFrom: string;

  @ApiPropertyOptional({ description: 'Payment currency (null for customer choice)', example: null })
  @IsOptional()
  @IsString()
  currencyTo?: string | null;

  @ApiPropertyOptional({ description: 'Settlement currency for conversion', example: 'USD' })
  @IsOptional()
  @IsString()
  settlementCurrency?: string | null;

  @ApiProperty({ description: 'Order reference/description', example: '30 chat minutes purchase' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({ description: 'Customer email for notifications' })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}

// Confirmo Webhook DTOs
export class ConfirmoInvoiceDto {
  @ApiProperty({ description: 'Invoice ID', example: 'inv_123456789' })
  id: string;

  @ApiProperty({ description: 'Invoice status', example: 'paid' })
  status: string;

  @ApiProperty({ description: 'Original amount', example: 30.00 })
  amount: number;

  @ApiProperty({ description: 'Original currency', example: 'USD' })
  currencyFrom: string;

  @ApiProperty({ description: 'Payment currency', example: 'BTC' })
  currencyTo: string;

  @ApiProperty({ description: 'Received amount in payment currency', example: 0.0005 })
  receivedAmount: number;

  @ApiProperty({ description: 'Settlement amount', example: 30.00 })
  settlementAmount: number;

  @ApiProperty({ description: 'Settlement currency', example: 'USD' })
  settlementCurrency: string;

  @ApiProperty({ description: 'Invoice URL for payment', example: 'https://confirmo.net/invoice/inv_123456789' })
  url: string;

  @ApiProperty({ description: 'Merchant reference', example: '30 chat minutes purchase' })
  reference: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  expires: string;

  @ApiPropertyOptional({ description: 'Payment timestamp' })
  paid?: string;

  @ApiPropertyOptional({ description: 'Transaction hash' })
  txHash?: string;
}

export class ConfirmoWebhookDto {
  @ApiProperty({ description: 'Webhook event type', example: 'invoice.paid' })
  event: string;

  @ApiProperty({ description: 'Invoice data', type: ConfirmoInvoiceDto })
  @ValidateNested()
  @Type(() => ConfirmoInvoiceDto)
  invoice: ConfirmoInvoiceDto;

  @ApiPropertyOptional({ description: 'Callback password for verification' })
  callbackPassword?: string;
}

// Response DTOs
export class ConfirmoPaymentResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Confirmo invoice ID', example: 'inv_123456789' })
  invoiceId: string;

  @ApiProperty({ description: 'Payment URL', example: 'https://confirmo.net/invoice/inv_123456789' })
  paymentUrl: string;

  @ApiProperty({ description: 'QR code data for mobile payments' })
  qrCode: string;

  @ApiProperty({ description: 'Invoice expiration time' })
  expiresAt: string;

  @ApiProperty({ description: 'Our internal transaction ID' })
  transactionId: string;
}

// Purchase DTOs with Confirmo integration
export class PurchaseWithConfirmoDto {
  @ApiProperty({ 
    description: 'Purchase type',
    enum: ['plan', 'minutes'],
    example: 'minutes'
  })
  @IsEnum(['plan', 'minutes'])
  type: 'plan' | 'minutes';

  @ApiPropertyOptional({ description: 'Payment plan ID (required for plan purchases)' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ 
    description: 'Number of minutes (required for minute purchases)',
    minimum: 1,
    maximum: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Preferred payment currency (BTC, LTC, etc.)' })
  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @ApiPropertyOptional({ description: 'Customer email for notifications' })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}
