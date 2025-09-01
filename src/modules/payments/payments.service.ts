import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentPlan, PaymentPlanDocument } from '../../schemas/payment-plan.schema';
import { PaymentTransaction, PaymentTransactionDocument } from '../../schemas/payment-transaction.schema';
import { UserWallet, UserWalletDocument } from '../../schemas/user-wallet.schema';
import { PurchaseMinutesDto, PurchaseMinutesResponseDto, MinutePricingDto } from './dto/purchase-minutes.dto';
import { PurchaseWithConfirmoDto, ConfirmoPaymentResponseDto, ConfirmoWebhookDto } from './dto/confirmo.dto';

import { ConfirmoService } from './services/confirmo.service';
import { StripeService } from './services/stripe.service';
import { User, UserDocument } from '../../schemas/user.schema';
import { CreateStripePaymentDto, StripePaymentResponseDto } from './dto/stripe.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentPlan.name) private paymentPlanModel: Model<PaymentPlanDocument>,
    @InjectModel(PaymentTransaction.name) private transactionModel: Model<PaymentTransactionDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private confirmoService: ConfirmoService,
    private stripeService: StripeService,
  ) {}

  // Get all available payment plans
  async getPaymentPlans(): Promise<PaymentPlan[]> {
    return this.paymentPlanModel
      .find({ active: true })
      .sort({ displayOrder: 1 })
      .exec();
  }

  // Get user's wallet information
  async getUserWallet(userId: string): Promise<UserWalletDocument> {
    // Ensure userId is properly formatted as ObjectId for query
    const userObjectId = new Types.ObjectId(userId);
    let wallet = await this.userWalletModel.findOne({ userId: userObjectId }).exec();
    
    if (!wallet) {
      try {
        wallet = new this.userWalletModel({
          userId: userObjectId,
          balance: {
            chatMinutes: 2, // Give new users 2 free chat minutes
            imageCredits: 0,
            tipCredits: 0,
          },
          usage: {
            totalChatMinutesUsed: 0,
            totalImagesGenerated: 0,
            totalTipsGiven: 0,
            totalSpent: 0,
          },
        });
        await wallet.save();
      } catch (error) {
        if (error.code === 11000) {
          // Handle duplicate key error - wallet was created by another request
          wallet = await this.userWalletModel.findOne({ userId: userObjectId }).exec();
          if (!wallet) {
            throw new Error(`Failed to create or find user wallet for userId: ${userId}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    return wallet;
  }

  // Create a payment transaction
  async createTransaction(
    userId: string,
    planId: string,
    paymentProvider: any,
  ): Promise<PaymentTransaction> {
    const plan = await this.paymentPlanModel.findById(planId).exec();
    if (!plan) {
      throw new NotFoundException('Payment plan not found');
    }

    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      planId: new Types.ObjectId(planId),
      details: {
        type: this.determineTransactionType(plan),
        quantity: this.calculateQuantity(plan),
        unitPrice: plan.pricing.amount,
        description: plan.description,
      },
      totalAmount: plan.pricing.amount,
      currency: plan.pricing.currency,
      provider: paymentProvider,
      status: 'pending',
    });

    return transaction.save();
  }

  // Process successful payment and add credits to user wallet
  async processSuccessfulPayment(transactionId: string): Promise<void> {
    const transaction = await this.transactionModel.findById(transactionId).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.creditsApplied) {
      throw new BadRequestException('Credits already applied for this transaction');
    }

    const wallet = await this.getUserWallet(transaction.userId.toString());
    
    // Add credits based on transaction type
    switch (transaction.details.type) {
      case 'chat_minutes':
        wallet.balance.chatMinutes += transaction.details.quantity;
        break;
      case 'image_credits':
        wallet.balance.imageCredits += transaction.details.quantity;
        break;
      case 'tip_credits':
        wallet.balance.tipCredits += transaction.details.quantity;
        break;
      case 'subscription':
        // Handle subscription logic
        wallet.hasActiveSubscription = true;
        wallet.subscriptionExpiresAt = this.calculateSubscriptionExpiry(transaction);
        break;
    }

    wallet.usage.totalSpent += transaction.totalAmount;
    await wallet.save();

    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.creditsApplied = true;
    await transaction.save();
  }

  // Consume credits from user wallet
  async consumeCredits(
    userId: string,
    type: 'chat_minutes' | 'image_credits' | 'tip_credits',
    amount: number,
  ): Promise<boolean> {
    const wallet = await this.getUserWallet(userId);
    
    // Check if user has enough credits
    switch (type) {
      case 'chat_minutes':
        if (wallet.balance.chatMinutes < amount && !wallet.hasActiveSubscription) {
          return false;
        }
        if (!wallet.hasActiveSubscription) {
          wallet.balance.chatMinutes -= amount;
        }
        wallet.usage.totalChatMinutesUsed += amount;
        break;
      case 'image_credits':
        if (wallet.balance.imageCredits < amount) {
          return false;
        }
        wallet.balance.imageCredits -= amount;
        wallet.usage.totalImagesGenerated += amount;
        break;
      case 'tip_credits':
        if (wallet.balance.tipCredits < amount) {
          return false;
        }
        wallet.balance.tipCredits -= amount;
        wallet.usage.totalTipsGiven += amount;
        break;
    }

    wallet.lastActivity = new Date();
    await wallet.save();
    return true;
  }

  // Get user's transaction history
  async getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    return this.transactionModel
      .find({ userId })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();
  }

  private determineTransactionType(plan: PaymentPlan): string {
    if (plan.features.unlimitedChat) {
      return 'subscription';
    } else if (plan.features.chatMinutes > 0) {
      return 'chat_minutes';
    } else if (plan.features.imageCredits > 0) {
      return 'image_credits';
    } else {
      return 'tip_credits';
    }
  }

  private calculateQuantity(plan: PaymentPlan): number {
    const features = plan.features;
    return Math.max(features.chatMinutes, features.imageCredits, features.tipCredits);
  }

  private calculateSubscriptionExpiry(transaction: PaymentTransaction): Date {
    const now = new Date();
    // Add 30 days for monthly subscription (this could be made more sophisticated)
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Helper method to add credits to user wallet
  private async addCreditsToWallet(userId: string, credits: {
    chatMinutes: number;
    imageCredits: number;
    tipCredits: number;
  }): Promise<void> {
    const wallet = await this.getUserWallet(userId);
    
    // Add credits to wallet balance
    wallet.balance.chatMinutes += credits.chatMinutes;
    wallet.balance.imageCredits += credits.imageCredits;
    wallet.balance.tipCredits += credits.tipCredits;
    
    // Update last activity
    wallet.lastActivity = new Date();
    
    await wallet.save();
  }

  // Get pricing information for dynamic minute purchases
  async getMinutePricing(): Promise<MinutePricingDto> {
    return {
      pricePerMinute: 100, // $1.00 in cents
      currency: 'USD',
      minQuantity: 1,
      maxQuantity: 500,
      suggestedQuantities: [5, 10, 30, 60, 120] // Popular quantities for quick selection
    };
  }

  // Purchase chat minutes dynamically at $1 per minute
  async purchaseMinutes(userId: string, purchaseDto: PurchaseMinutesDto): Promise<PurchaseMinutesResponseDto> {
    const { quantity, paymentMethodId, provider } = purchaseDto;
    
    // Calculate total amount (quantity * $1.00)
    const totalAmount = quantity * 100; // $1 per minute in cents
    
    // Create transaction record
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      planId: null, // No plan for dynamic purchases
      details: {
        type: 'chat_minutes',
        quantity,
        unitPrice: 100, // $1 per minute in cents
        description: `${quantity} chat minutes at $1.00 per minute`
      },
      totalAmount,
      currency: 'USD',
      status: 'pending',
      provider: {
        name: provider,
        paymentMethodId,
        transactionId: `min_${Date.now()}_${userId.slice(-6)}`, // Generate unique transaction ID
        customerId: userId,
      },
    });

    await transaction.save();

    // Simulate payment processing (in real implementation, integrate with Stripe/PayPal)
    // For now, we'll mark it as completed immediately
    transaction.status = 'completed';
    transaction.provider.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    transaction.completedAt = new Date();
    transaction.creditsApplied = true;
    await transaction.save();

    // Add minutes to user's wallet
    await this.addCreditsToWallet(userId, {
      chatMinutes: quantity,
      imageCredits: 0,
      tipCredits: 0
    });

    return {
      success: true,
      transactionId: transaction.provider.transactionId,
      minutesPurchased: quantity,
      totalAmount,
      currency: 'USD',
      status: 'completed'
    };
  }

  // Purchase with Confirmo Crypto (Plans or Minutes)
  async purchaseWithConfirmo(userId: string, purchaseDto: PurchaseWithConfirmoDto): Promise<ConfirmoPaymentResponseDto> {
    let amount: number;
    let description: string;
    let planId: Types.ObjectId | null = null;
    let transactionDetails: any;

    if (purchaseDto.type === 'plan') {
      if (!purchaseDto.planId) {
        throw new BadRequestException('Plan ID is required for plan purchases');
      }

      const plan = await this.paymentPlanModel.findById(purchaseDto.planId);
      if (!plan) {
        throw new NotFoundException('Payment plan not found');
      }

      amount = plan.pricing.amount / 100; // Convert cents to dollars
      description = `${plan.name} - ${plan.description}`;
      planId = new Types.ObjectId(purchaseDto.planId);
      transactionDetails = {
        type: 'subscription',
        quantity: 1,
        unitPrice: plan.pricing.amount,
        description: plan.name
      };

    } else if (purchaseDto.type === 'minutes') {
      if (!purchaseDto.quantity || purchaseDto.quantity < 1 || purchaseDto.quantity > 500) {
        throw new BadRequestException('Quantity must be between 1 and 500 minutes');
      }

      amount = purchaseDto.quantity * 1.00; // $1 per minute
      description = `${purchaseDto.quantity} chat minutes at $1.00 per minute`;
      transactionDetails = {
        type: 'chat_minutes',
        quantity: purchaseDto.quantity,
        unitPrice: 100, // $1 in cents
        description
      };

    } else {
      throw new BadRequestException('Invalid purchase type');
    }

    // Create transaction record
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      planId,
      details: transactionDetails,
      totalAmount: amount * 100, // Store in cents
      currency: 'USD',
      status: 'pending',
      provider: {
        name: 'confirmo',
        paymentMethodId: 'crypto',
        transactionId: '', // Will be filled by Confirmo
        customerId: userId,
      },
    });

    await transaction.save();

    // Create Confirmo invoice
    const confirmoInvoice = await this.confirmoService.createInvoice(
      userId,
      {
        amount,
        currencyFrom: 'USD',
        currencyTo: purchaseDto.preferredCurrency || null, // null allows customer choice
        settlementCurrency: 'USD', // Convert to USD for easier accounting
        reference: description,
        customerEmail: purchaseDto.customerEmail,
      },
      transaction._id.toString()
    );

    return confirmoInvoice;
  }

  // Process Confirmo webhook
  async processConfirmoWebhook(webhookData: ConfirmoWebhookDto): Promise<{ success: boolean; message: string }> {
    const result = await this.confirmoService.processWebhook(webhookData);
    
    // If payment was completed, process the credits
    if (result.success && webhookData.invoice.status === 'paid') {
      const transaction = await this.transactionModel.findOne({
        'provider.transactionId': webhookData.invoice.id,
        'provider.name': 'confirmo',
      });

      if (transaction && !transaction.creditsApplied) {
        await this.processSuccessfulPayment(transaction._id.toString());
      }
    }

    return result;
  }

  // Get supported cryptocurrencies
  async getSupportedCryptocurrencies(): Promise<any[]> {
    return this.confirmoService.getSupportedAssets();
  }

  // Get Confirmo configuration status
  getConfirmoStatus(): { configured: boolean; apiUrl: string; webhookUrl: string } {
    return this.confirmoService.getConfigStatus();
  }

  // Get transaction history for a user
  async getTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
    return this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('planId')
      .exec();
  }

  // Stripe Integration Methods

  // Create Stripe payment intent for purchasing chat minutes
  async createStripePayment(userId: string, purchaseDto: CreateStripePaymentDto): Promise<StripePaymentResponseDto> {
    const { quantity, customerEmail } = purchaseDto;

    // Get user information for customer email if not provided
    let email = customerEmail;
    if (!email) {
      const user = await this.userModel.findById(userId);
      email = user?.email;
    }

    // Create payment intent with Stripe
    const paymentIntent = await this.stripeService.createPaymentIntent(
      userId,
      quantity,
      email,
      {
        source: 'chat_minutes_purchase'
      }
    );

    // Create transaction record in database
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      planId: null, // No plan for direct minute purchases
      details: {
        type: 'chat_minutes',
        quantity,
        unitPrice: 100, // $1 per minute in cents
        description: `${quantity} chat minutes at $1.00 per minute`
      },
      totalAmount: quantity * 100, // Store in cents
      currency: 'USD',
      status: 'pending',
      provider: {
        name: 'stripe',
        paymentMethodId: 'card',
        transactionId: paymentIntent.id,
        customerId: userId,
      },
    });

    await transaction.save();

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      quantity,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    };
  }

  // Process Stripe webhook events
  async processStripeWebhook(
    payload: string | any,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    const webhookResult = await this.stripeService.processWebhook(payload, signature);
    
    if (!webhookResult.success || !webhookResult.event) {
      return webhookResult;
    }

    const event = webhookResult.event;

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        default:
          // Log unhandled event types for debugging
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return {
        success: true,
        message: `Stripe webhook ${event.type} processed successfully`
      };
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      return {
        success: false,
        message: `Failed to process webhook: ${error.message}`
      };
    }
  }

  // Handle successful Stripe payment
  private async handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const transaction = await this.transactionModel.findOne({
      'provider.transactionId': paymentIntent.id,
      'provider.name': 'stripe'
    });

    if (!transaction) {
      throw new Error(`Transaction not found for payment intent: ${paymentIntent.id}`);
    }

    if (transaction.creditsApplied) {
      console.log(`Credits already applied for transaction: ${transaction._id}`);
      return;
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Add minutes to user wallet
    const userId = paymentIntent.metadata.userId;
    const quantity = parseInt(paymentIntent.metadata.quantity);

    if (userId && quantity) {
      await this.addCreditsToWallet(userId, {
        chatMinutes: quantity,
        imageCredits: 0,
        tipCredits: 0
      });

      // Mark credits as applied
      transaction.creditsApplied = true;
      await transaction.save();

      console.log(`Added ${quantity} chat minutes to user ${userId} wallet`);
    }
  }

  // Handle failed Stripe payment
  private async handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const transaction = await this.transactionModel.findOne({
      'provider.transactionId': paymentIntent.id,
      'provider.name': 'stripe'
    });

    if (transaction) {
      transaction.status = 'failed';
      transaction.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await transaction.save();
      
      console.log(`Payment failed for transaction: ${transaction._id}`);
    }
  }

  // Get Stripe configuration status
  getStripeStatus(): { configured: boolean; webhookConfigured: boolean } {
    return this.stripeService.getConfigStatus();
  }

}
