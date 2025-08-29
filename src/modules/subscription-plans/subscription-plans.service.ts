import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Subscription, SubscriptionDocument, SubscriptionStatus, SubscriptionTier, PaymentProcessor } from '../../schemas/subscription.schema';
import {
  CreateSubscriptionDto,
  ApplyPromoCodeDto,
  CCBillWebhookDto,
  SubscriptionPlansResponseDto,
  CreateSubscriptionResponseDto,
  CurrentSubscriptionResponseDto,
  PromoCodeResponseDto
} from './dto/subscription.dto';
import * as crypto from 'crypto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // Predefined subscription plans
  private readonly plans = [
    {
      id: 'plan_free',
      name: 'Free',
      tier: SubscriptionTier.FREE,
      pricing: {
        monthly: 0,
        yearly: 0,
        currency: 'USD'
      },
      features: {
        girlfriends: 1,
        chatMinutesPerDay: 5,
        messagesPerDay: 50,
        imagesPerDay: 3,
        prioritySupport: false,
        advancedPersonalities: false,
        customization: 'basic',
        nsfwContent: false
      },
      popular: false,
      trialDays: 0
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      tier: SubscriptionTier.PREMIUM,
      pricing: {
        monthly: 19.99,
        yearly: 199.99,
        currency: 'USD',
        yearlyDiscount: 17
      },
      features: {
        girlfriends: -1, // unlimited
        chatMinutesPerDay: -1, // unlimited
        messagesPerDay: -1, // unlimited
        imagesPerDay: 100,
        prioritySupport: true,
        advancedPersonalities: true,
        customization: 'advanced',
        nsfwContent: 'all'
      },
      popular: true,
      trialDays: 7
    },
    {
      id: 'plan_ultimate',
      name: 'Ultimate',
      tier: SubscriptionTier.ULTIMATE,
      pricing: {
        monthly: 39.99,
        yearly: 399.99,
        currency: 'USD',
        yearlyDiscount: 17
      },
      features: {
        girlfriends: -1, // unlimited
        chatMinutesPerDay: -1, // unlimited
        messagesPerDay: -1, // unlimited
        imagesPerDay: -1, // unlimited
        prioritySupport: true,
        advancedPersonalities: true,
        customization: 'premium',
        nsfwContent: 'all'
      },
      popular: false,
      trialDays: 14
    }
  ];

  // Promo codes configuration
  private readonly promoCodes = {
    'WELCOME20': { type: 'percentage', value: 20, validUntil: '2024-12-31' },
    'ADULT30': { type: 'percentage', value: 30, validUntil: '2024-12-31' },
    'PREMIUM50': { type: 'percentage', value: 50, validUntil: '2024-12-31' },
    'BIRTHDAY25': { type: 'percentage', value: 25, validUntil: '2024-12-31' }
  };

  async getPlans(): Promise<SubscriptionPlansResponseDto> {
    return {
      success: true,
      data: {
        plans: this.plans
      }
    };
  }

  async createSubscription(userId: string, createDto: CreateSubscriptionDto): Promise<CreateSubscriptionResponseDto> {
    try {
      // Validate user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate plan exists
      const plan = this.plans.find(p => p.id === createDto.planId);
      if (!plan) {
        throw new BadRequestException('Invalid plan ID');
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        deletedAt: null
      });

      if (existingSubscription) {
        throw new BadRequestException('User already has an active subscription');
      }

      // Calculate pricing with discounts
      let amount = createDto.billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
      let discountAmount = 0;
      let discountType = '';

      // Apply promo code if provided
      if (createDto.couponCode) {
        const promoResult = await this.validatePromoCode(createDto.couponCode, amount);
        if (promoResult.applied) {
          discountAmount = amount - promoResult.newAmount;
          discountType = promoResult.discountType;
          amount = promoResult.newAmount;
        }
      }

      // Generate CCBill transaction ID
      const transactionId = `ccb_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      
      // Calculate trial and billing dates
      const now = new Date();
      const trialEnd = plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null;
      const currentPeriodStart = now;
      const currentPeriodEnd = trialEnd || this.calculateNextBillingDate(now, createDto.billingCycle);
      const nextBillingDate = trialEnd ? this.calculateNextBillingDate(trialEnd, createDto.billingCycle) : currentPeriodEnd;

      // Create subscription record
      const subscription = new this.subscriptionModel({
        userId,
        planId: plan.id,
        planName: plan.name,
        tier: plan.tier,
        status: plan.trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        processor: PaymentProcessor.CCBILL,
        transactionId,
        amount,
        currency: plan.pricing.currency,
        billingCycle: createDto.billingCycle,
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
        nextBillingDate,
        autoRenew: createDto.autoRenew ?? true,
        anonymous: createDto.anonymous ?? false,
        billingDescriptor: 'DIGITAL SERVICES',
        couponCode: createDto.couponCode,
        discountAmount,
        discountType,
        features: plan.features,
        billingHistory: [],
        metadata: {
          // These would be populated from request headers in real implementation
          userAgent: 'Unknown',
          ipAddress: 'Unknown',
          country: 'Unknown'
        }
      });

      await subscription.save();

      // Generate CCBill redirect URL
      const redirectUrl = this.generateCCBillRedirectUrl(subscription, createDto);

      return {
        success: true,
        data: {
          subscriptionId: subscription._id.toString(),
          paymentStatus: 'pending',
          redirectUrl,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          trialEnd: subscription.trialEnd?.toISOString(),
          nextBillingDate: subscription.nextBillingDate.toISOString(),
          amount: subscription.amount,
          currency: subscription.currency,
          processor: subscription.processor,
          discrete: subscription.anonymous,
          billingDescriptor: subscription.billingDescriptor,
          transactionId: subscription.transactionId
        }
      };
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCurrentSubscription(userId: string): Promise<CurrentSubscriptionResponseDto> {
    const subscription = await this.subscriptionModel.findOne({
      userId,
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      deletedAt: null
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const plan = this.plans.find(p => p.id === subscription.planId);

    return {
      success: true,
      data: {
        subscription: {
          id: subscription._id.toString(),
          planId: subscription.planId,
          planName: subscription.planName,
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEnd: subscription.trialEnd?.toISOString(),
          autoRenew: subscription.autoRenew,
          processor: subscription.processor,
          transactionId: subscription.transactionId
        },
        billing: {
          nextBillingDate: subscription.nextBillingDate.toISOString(),
          amount: subscription.amount,
          currency: subscription.currency,
          processor: subscription.processor,
          billingDescriptor: subscription.billingDescriptor
        },
        features: {
          premiumPersonalities: plan?.features.advancedPersonalities || false,
          prioritySupport: plan?.features.prioritySupport || false,
          nsfwContent: plan?.features.nsfwContent || false,
          imageGeneration: plan?.features.imagesPerDay === -1 ? 'unlimited' : 'limited',
          exportData: subscription.tier !== SubscriptionTier.FREE,
          anonymousMode: subscription.anonymous
        }
      }
    };
  }

  async applyPromoCode(code: string, subscriptionId?: string): Promise<PromoCodeResponseDto> {
    const promoConfig = this.promoCodes[code.toUpperCase()];
    if (!promoConfig) {
      throw new BadRequestException('Invalid promo code');
    }

    // Check if promo code is still valid
    const validUntil = new Date(promoConfig.validUntil);
    if (new Date() > validUntil) {
      throw new BadRequestException('Promo code has expired');
    }

    // For demonstration, assume a base amount of $19.99
    const baseAmount = 19.99;
    const result = await this.validatePromoCode(code, baseAmount);

    return {
      success: true,
      data: result
    };
  }

  async handleCCBillWebhook(webhook: CCBillWebhookDto): Promise<{ received: boolean; message?: string }> {
    try {
      this.logger.log(`Received CCBill webhook: ${webhook.eventType}`);

      // Verify webhook signature (in real implementation)
      if (!this.verifyCCBillWebhook(webhook)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Find subscription by transaction ID or CCBill subscription ID
      const subscription = await this.subscriptionModel.findOne({
        $or: [
          { transactionId: webhook.transactionId },
          { ccbillSubscriptionId: webhook.subscriptionId }
        ],
        deletedAt: null
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found for webhook: ${webhook.transactionId}`);
        return { received: true, message: 'Subscription not found' };
      }

      // Process webhook based on event type
      switch (webhook.eventType) {
        case 'NewSaleSuccess':
          await this.activateSubscription(subscription, webhook);
          break;
        case 'RenewalSuccess':
          await this.renewSubscription(subscription, webhook);
          break;
        case 'Cancellation':
          await this.cancelSubscription(subscription, webhook);
          break;
        case 'Chargeback':
          await this.handleChargeback(subscription, webhook);
          break;
        default:
          this.logger.warn(`Unhandled webhook event type: ${webhook.eventType}`);
      }

      return { received: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Failed to process CCBill webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods
  private async validatePromoCode(code: string, amount: number) {
    const promoConfig = this.promoCodes[code.toUpperCase()];
    if (!promoConfig) {
      return {
        code,
        discountType: '',
        discountValue: 0,
        validUntil: '',
        applied: false,
        newAmount: amount,
        savings: 0
      };
    }

    let newAmount = amount;
    let savings = 0;

    if (promoConfig.type === 'percentage') {
      savings = (amount * promoConfig.value) / 100;
      newAmount = amount - savings;
    } else if (promoConfig.type === 'fixed') {
      savings = Math.min(promoConfig.value, amount);
      newAmount = amount - savings;
    }

    return {
      code,
      discountType: promoConfig.type,
      discountValue: promoConfig.value,
      validUntil: promoConfig.validUntil,
      applied: true,
      newAmount: Math.max(0, newAmount),
      savings
    };
  }

  private generateCCBillRedirectUrl(subscription: SubscriptionDocument, createDto: CreateSubscriptionDto): string {
    // In real implementation, this would generate a proper CCBill FlexForms URL
    const clientAccnum = process.env.CCBILL_CLIENT_ACCNUM || '123456';
    const clientSubacc = process.env.CCBILL_CLIENT_SUBACC || '0001';
    
    const params = new URLSearchParams({
      clientAccnum,
      clientSubacc,
      formName: process.env.CCBILL_FORM_NAME || '1cc',
      subscriptionId: subscription._id.toString(),
      amount: subscription.amount.toString(),
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      productId: subscription.planId,
      productName: subscription.planName,
      productDescription: `${subscription.planName} Subscription`,
      discrete: subscription.anonymous ? '1' : '0'
    });

    return `https://bill.ccbill.com/jpost/signup.cgi?${params.toString()}`;
  }

  private calculateNextBillingDate(fromDate: Date, billingCycle: string): Date {
    const date = new Date(fromDate);
    if (billingCycle === 'yearly') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  private verifyCCBillWebhook(webhook: CCBillWebhookDto): boolean {
    // In real implementation, verify webhook signature using CCBill's verification method
    // This is a placeholder that always returns true for development
    return true;
  }

  private async activateSubscription(subscription: SubscriptionDocument, webhook: CCBillWebhookDto) {
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.ccbillSubscriptionId = webhook.subscriptionId;
    subscription.ccbillCustomerId = webhook.customerId;
    
    // Add billing history entry
    subscription.billingHistory.push({
      date: new Date(webhook.eventTime),
      amount: parseFloat(webhook.billingData.initialPrice),
      currency: webhook.billingData.currency,
      transactionId: webhook.transactionId,
      status: 'success',
      processor: 'ccbill'
    });

    await subscription.save();
    this.logger.log(`Subscription activated: ${subscription._id}`);
  }

  private async renewSubscription(subscription: SubscriptionDocument, webhook: CCBillWebhookDto) {
    // Update billing period
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = this.calculateNextBillingDate(new Date(), subscription.billingCycle);
    subscription.nextBillingDate = this.calculateNextBillingDate(subscription.currentPeriodEnd, subscription.billingCycle);
    
    // Add billing history entry
    subscription.billingHistory.push({
      date: new Date(webhook.eventTime),
      amount: parseFloat(webhook.billingData.recurringPrice),
      currency: webhook.billingData.currency,
      transactionId: webhook.transactionId,
      status: 'success',
      processor: 'ccbill'
    });

    await subscription.save();
    this.logger.log(`Subscription renewed: ${subscription._id}`);
  }

  private async cancelSubscription(subscription: SubscriptionDocument, webhook: CCBillWebhookDto) {
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date(webhook.eventTime);
    subscription.cancelReason = 'customer_request';
    subscription.autoRenew = false;

    await subscription.save();
    this.logger.log(`Subscription canceled: ${subscription._id}`);
  }

  private async handleChargeback(subscription: SubscriptionDocument, webhook: CCBillWebhookDto) {
    subscription.status = SubscriptionStatus.UNPAID;
    
    // Add billing history entry for chargeback
    subscription.billingHistory.push({
      date: new Date(webhook.eventTime),
      amount: -parseFloat(webhook.billingData.recurringPrice || webhook.billingData.initialPrice),
      currency: webhook.billingData.currency,
      transactionId: webhook.transactionId,
      status: 'chargeback',
      processor: 'ccbill'
    });

    await subscription.save();
    this.logger.log(`Chargeback processed for subscription: ${subscription._id}`);
  }
}
