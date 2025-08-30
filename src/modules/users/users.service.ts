import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { UserWallet, UserWalletDocument } from '../../schemas/user-wallet.schema';
import { PaymentTransaction, PaymentTransactionDocument } from '../../schemas/payment-transaction.schema';
import { PaymentPlan, PaymentPlanDocument } from '../../schemas/payment-plan.schema';
import { UserProfileDto, RecentTransactionDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(PaymentTransaction.name) private transactionModel: Model<PaymentTransactionDocument>,
    @InjectModel(PaymentPlan.name) private paymentPlanModel: Model<PaymentPlanDocument>,
  ) {}

  // Get or create user wallet
  private async getUserWallet(userId: string): Promise<UserWalletDocument> {
    // Convert string to ObjectId for proper query
    const userObjectId = new Types.ObjectId(userId);
    let wallet = await this.userWalletModel.findOne({ userId: userObjectId }).exec();
    
    if (!wallet) {
      try {
        // Create wallet if it doesn't exist
        wallet = new this.userWalletModel({
          userId: userObjectId,
          balance: {
            chatMinutes: 0,
            imageCredits: 0,
            tipCredits: 0,
          },
          usage: {
            totalChatMinutesUsed: 0,
            totalImagesGenerated: 0,
            totalTipsGiven: 0,
            totalSpent: 0,
          },
          hasActiveSubscription: false,
          lastActivity: new Date(),
        });
        await wallet.save();
      } catch (error) {
        // If duplicate key error, try to find the existing wallet again
        if (error.code === 11000) {
          wallet = await this.userWalletModel.findOne({ userId: userObjectId }).exec();
          if (!wallet) {
            throw new Error('Failed to create or find user wallet');
          }
        } else {
          throw error;
        }
      }
    }
    
    return wallet;
  }

  // Get complete user profile with balance, usage, and transaction history
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    // Get user basic info
    const user = await this.userModel.findById(userId).select('email profile createdAt').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user wallet (create if doesn't exist)
    const wallet = await this.getUserWallet(userId);

    // Get recent transactions (last 10)
    const transactions = await this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('planId')
      .exec();

    // Get total transaction count
    const totalTransactions = await this.transactionModel.countDocuments({ 
      userId: new Types.ObjectId(userId) 
    });

    // Calculate subscription status
    const now = new Date();
    let subscriptionStatus: 'active' | 'expired' | 'none' = 'none';
    let daysUntilExpiry: number | undefined;

    if (wallet.hasActiveSubscription && wallet.subscriptionExpiresAt) {
      if (wallet.subscriptionExpiresAt > now) {
        subscriptionStatus = 'active';
        daysUntilExpiry = Math.ceil(
          (wallet.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else {
        subscriptionStatus = 'expired';
      }
    }

    // Format recent transactions
    const recentTransactions: RecentTransactionDto[] = transactions.map(tx => {
      const planName = tx.planId ? (tx.planId as any).name : undefined;
      
      return {
        id: tx._id.toString(),
        type: tx.details.type,
        amount: tx.totalAmount,
        amountUSD: tx.totalAmount / 100,
        status: tx.status,
        provider: tx.provider.name,
        createdAt: (tx as any).createdAt,
        planName,
        creditsReceived: {
          chatMinutes: tx.details.type === 'chat_minutes' ? tx.details.quantity : 0,
          imageCredits: tx.details.type === 'image_credits' ? tx.details.quantity : 0,
          tipCredits: tx.details.type === 'tip_credits' ? tx.details.quantity : 0,
        }
      };
    });

    // Determine favorite payment method
    const paymentMethods = transactions.map(tx => tx.provider.name);
    const methodCounts = paymentMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoritePaymentMethod = Object.keys(methodCounts).length > 0 
      ? Object.keys(methodCounts).reduce((a, b) => methodCounts[a] > methodCounts[b] ? a : b)
      : 'none';

    // Calculate member since
    const memberSince = (user as any).createdAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    // Get user display name
    const displayName = user.profile?.displayName || 
                       (user.profile?.firstName && user.profile?.lastName 
                         ? `${user.profile.firstName} ${user.profile.lastName}` 
                         : 'User');

    return {
      userId: user._id.toString(),
      email: user.email,
      name: displayName,
      createdAt: (user as any).createdAt,
      lastActivity: wallet.lastActivity,
      balance: {
        chatMinutes: wallet.balance.chatMinutes,
        imageCredits: wallet.balance.imageCredits,
        tipCredits: wallet.balance.tipCredits,
      },
      usage: {
        totalChatMinutesUsed: wallet.usage.totalChatMinutesUsed,
        totalImagesGenerated: wallet.usage.totalImagesGenerated,
        totalTipsGiven: wallet.usage.totalTipsGiven,
        totalSpent: wallet.usage.totalSpent,
        totalSpentUSD: wallet.usage.totalSpent / 100,
      },
      subscription: {
        hasActiveSubscription: wallet.hasActiveSubscription,
        subscriptionExpiresAt: wallet.subscriptionExpiresAt,
        daysUntilExpiry,
        status: subscriptionStatus,
      },
      recentTransactions,
      stats: {
        totalTransactions,
        memberSince,
        favoritePaymentMethod,
      }
    };
  }

  // Get user basic info
  async getUserById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Update user profile
  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }
}
