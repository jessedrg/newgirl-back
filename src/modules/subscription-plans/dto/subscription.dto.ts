import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsObject, Min, Max, IsEmail, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums for validation
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum PaymentProcessor {
  CCBILL = 'ccbill'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid'
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ULTIMATE = 'ultimate'
}

// Create Subscription DTO
export class CreateSubscriptionDto {
  @ApiProperty({ example: 'plan_premium', description: 'Plan ID to subscribe to' })
  @IsString()
  planId: string;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ 
    type: 'object',
    example: {
      type: 'ccbill',
      processor: 'ccbill',
      redirectUrl: 'https://bill.ccbill.com/jpost/signup.cgi?clientAccnum=123456'
    }
  })
  @IsObject()
  paymentMethod: {
    type: string;
    processor: PaymentProcessor;
    redirectUrl?: string;
  };

  @ApiPropertyOptional({ example: 'WELCOME20', description: 'Promo code for discount' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: true, description: 'Auto-renew subscription' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Anonymous payment mode' })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}

// Apply Promo Code DTO
export class ApplyPromoCodeDto {
  @ApiProperty({ example: 'ADULT30', description: 'Promo code to apply' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'sub_64f8b2c4e1234567890abcde' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;
}

// Webhook DTOs
export class CCBillWebhookDto {
  @ApiProperty({ example: 'NewSaleSuccess' })
  @IsString()
  eventType: string;

  @ApiProperty({ example: '2024-08-28T10:00:00Z' })
  @IsString()
  eventTime: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  clientAccnum: string;

  @ApiProperty({ example: '0001' })
  @IsString()
  clientSubacc: string;

  @ApiProperty({ example: 'sub_64f8b2c4e1234567890abcde' })
  @IsString()
  subscriptionId: string;

  @ApiProperty({ example: 'ccb_trans_abc123' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 'cust_def456' })
  @IsString()
  customerId: string;

  @ApiProperty({ type: 'object' })
  @IsObject()
  billingData: {
    initialPrice: string;
    initialPeriod: string;
    recurringPrice: string;
    recurringPeriod: string;
    currency: string;
    paymentType: string;
  };

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  customerInfo?: {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
  };

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  productInfo?: {
    productId: string;
    productName: string;
    productDescription: string;
  };

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  subscriptionData?: {
    nextRenewalDate: string;
    subscriptionTypeId: string;
    trialPeriod: string;
  };
}



// Response DTOs
export class SubscriptionPlanDto {
  @ApiProperty({ example: 'plan_premium' })
  id: string;

  @ApiProperty({ example: 'Premium' })
  name: string;

  @ApiProperty({ enum: SubscriptionTier, example: SubscriptionTier.PREMIUM })
  tier: SubscriptionTier;

  @ApiProperty({ type: 'object' })
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
    yearlyDiscount?: number;
  };

  @ApiProperty({ type: 'object' })
  features: {
    girlfriends: number; // -1 for unlimited
    chatMinutesPerDay: number; // -1 for unlimited
    messagesPerDay: number; // -1 for unlimited
    imagesPerDay: number;
    prioritySupport: boolean;
    advancedPersonalities: boolean;
    customization: string;
    nsfwContent: boolean | string;
  };

  @ApiProperty({ example: true })
  popular: boolean;

  @ApiProperty({ example: 7 })
  trialDays: number;
}

export class SubscriptionPlansResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    plans: SubscriptionPlanDto[];
  };
}

export class CreateSubscriptionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    subscriptionId: string;
    paymentStatus: string;
    redirectUrl?: string;
    status: SubscriptionStatus;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEnd?: string;
    nextBillingDate: string;
    amount: number;
    currency: string;
    processor: PaymentProcessor;
    discrete: boolean;
    billingDescriptor: string;
    transactionId: string;
  };
}

export class CurrentSubscriptionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    subscription: {
      id: string;
      planId: string;
      planName: string;
      tier: SubscriptionTier;
      status: SubscriptionStatus;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      trialEnd?: string;
      autoRenew: boolean;
      processor: PaymentProcessor;
      transactionId: string;
    };
    billing: {
      nextBillingDate: string;
      amount: number;
      currency: string;
      processor: PaymentProcessor;
      billingDescriptor: string;
    };
    features: {
      premiumPersonalities: boolean;
      prioritySupport: boolean;
      nsfwContent: boolean | string;
      imageGeneration: string;
      exportData: boolean;
      anonymousMode: boolean;
    };
  };
}

export class PromoCodeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: {
    code: string;
    discountType: string; // 'percentage' | 'fixed'
    discountValue: number;
    validUntil: string;
    applied: boolean;
    newAmount: number;
    savings: number;
  };
}

export class WebhookResponseDto {
  @ApiProperty({ example: true })
  received: boolean;

  @ApiPropertyOptional({ example: 'Webhook processed successfully' })
  @IsOptional()
  message?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ type: 'object' })
  error: {
    code: string;
    message: string;
    processor?: PaymentProcessor;
    retryAfter?: number;
    suggestedActions?: string[];
    availablePlans?: string[];
  };
}
