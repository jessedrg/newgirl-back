import { Controller, Get, Post, Body, Request, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionPlansService } from './subscription-plans.service';
import {
  CreateSubscriptionDto,
  ApplyPromoCodeDto,
  CCBillWebhookDto,
  SubscriptionPlansResponseDto,
  CreateSubscriptionResponseDto,
  CurrentSubscriptionResponseDto,
  PromoCodeResponseDto,
  WebhookResponseDto,
  ErrorResponseDto
} from './dto/subscription.dto';

@ApiTags('Subscription Management')
@Controller('subscription')
export class SubscriptionPlansController {
  private readonly logger = new Logger(SubscriptionPlansController.name);

  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Get('plans')
  @ApiOperation({ 
    summary: 'Get subscription plans',
    description: 'Retrieve all available subscription plans with pricing and features'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved subscription plans',
    type: SubscriptionPlansResponseDto
  })
  async getPlans(): Promise<SubscriptionPlansResponseDto> {
    return this.subscriptionPlansService.getPlans();
  }

  @Post('create')
  @UseGuards(ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create subscription',
    description: 'Create a new subscription with CCBill payment processing'
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription created successfully',
    type: CreateSubscriptionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid plan ID or user already has active subscription',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many requests - Rate limit exceeded'
  })
  async createSubscription(
    @Body() createDto: CreateSubscriptionDto,
    @Request() req: any
  ): Promise<CreateSubscriptionResponseDto> {
    // TODO: Extract user ID from JWT token when auth guard is implemented
    const userId = req.user?.id || 'temp_user_id';
    return this.subscriptionPlansService.createSubscription(userId, createDto);
  }

  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current subscription',
    description: 'Retrieve current active subscription details for authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved current subscription',
    type: CurrentSubscriptionResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No active subscription found',
    type: ErrorResponseDto
  })
  async getCurrentSubscription(@Request() req: any): Promise<CurrentSubscriptionResponseDto> {
    // TODO: Extract user ID from JWT token when auth guard is implemented
    const userId = req.user?.id || 'temp_user_id';
    return this.subscriptionPlansService.getCurrentSubscription(userId);
  }

  @Post('promo/apply')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Apply promo code',
    description: 'Apply a promotional code to get discount information'
  })
  @ApiBody({ type: ApplyPromoCodeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Promo code applied successfully',
    type: PromoCodeResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired promo code',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  async applyPromoCode(@Body() applyDto: ApplyPromoCodeDto): Promise<PromoCodeResponseDto> {
    return this.subscriptionPlansService.applyPromoCode(applyDto.code, applyDto.subscriptionId);
  }

  @Post('webhooks/ccbill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'CCBill webhook endpoint',
    description: 'Handle CCBill payment processor webhooks for subscription events'
  })
  @ApiBody({ type: CCBillWebhookDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    type: WebhookResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid webhook signature'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid webhook data'
  })
  async handleCCBillWebhook(@Body() webhook: CCBillWebhookDto): Promise<WebhookResponseDto> {
    this.logger.log(`Received CCBill webhook: ${webhook.eventType} for subscription: ${webhook.subscriptionId}`);
    
    try {
      const result = await this.subscriptionPlansService.handleCCBillWebhook(webhook);
      return {
        received: result.received,
        message: result.message
      };
    } catch (error) {
      this.logger.error(`CCBill webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Additional endpoints for subscription management
  
  @Post('cancel')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cancel subscription',
    description: 'Cancel the current active subscription (will remain active until period end)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription canceled successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No active subscription found'
  })
  async cancelSubscription(@Request() req: any): Promise<{ success: boolean; message: string }> {
    // TODO: Implement subscription cancellation logic
    const userId = req.user?.id || 'temp_user_id';
    
    // Placeholder implementation
    return {
      success: true,
      message: 'Subscription cancellation initiated. Your subscription will remain active until the end of the current billing period.'
    };
  }

  @Post('reactivate')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Reactivate subscription',
    description: 'Reactivate a canceled subscription before the period ends'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription reactivated successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No canceled subscription found'
  })
  async reactivateSubscription(@Request() req: any): Promise<{ success: boolean; message: string }> {
    // TODO: Implement subscription reactivation logic
    const userId = req.user?.id || 'temp_user_id';
    
    // Placeholder implementation
    return {
      success: true,
      message: 'Subscription reactivated successfully. Auto-renewal has been enabled.'
    };
  }

  @Get('billing-history')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get billing history',
    description: 'Retrieve billing history for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved billing history'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required'
  })
  async getBillingHistory(@Request() req: any): Promise<{ success: boolean; data: any[] }> {
    // TODO: Implement billing history retrieval
    const userId = req.user?.id || 'temp_user_id';
    
    // Placeholder implementation
    return {
      success: true,
      data: [
        {
          date: '2024-08-01T00:00:00Z',
          amount: 19.99,
          currency: 'USD',
          status: 'success',
          description: 'Premium Subscription - Monthly',
          transactionId: 'ccb_trans_abc123'
        }
      ]
    };
  }
}
