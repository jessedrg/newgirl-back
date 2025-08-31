import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchaseMinutesDto, PurchaseMinutesResponseDto, MinutePricingDto } from './dto/purchase-minutes.dto';
import { PurchaseWithConfirmoDto, ConfirmoPaymentResponseDto, ConfirmoWebhookDto } from './dto/confirmo.dto';
import { CreateStripePaymentDto, StripePaymentResponseDto, StripeWebhookDto } from './dto/stripe.dto';

// DTOs for request/response
export class CreatePaymentDto {
  planId: string;
  paymentMethodId: string;
  provider: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
}

export class ConsumeCreditsDto {
  type: 'chat_minutes' | 'image_credits' | 'tip_credits';
  amount: number;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available payment plans' })
  @ApiResponse({ status: 200, description: 'List of payment plans' })
  async getPaymentPlans() {
    return this.paymentsService.getPaymentPlans();
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wallet information' })
  @ApiResponse({ status: 200, description: 'User wallet details' })
  async getUserWallet(@Request() req) {
    return this.paymentsService.getUserWallet(req.user.userId);
  }

  @Get('minutes/pricing')
  @ApiOperation({ summary: 'Get pricing information for purchasing chat minutes' })
  @ApiResponse({ status: 200, description: 'Minute pricing details', type: MinutePricingDto })
  async getMinutePricing(): Promise<MinutePricingDto> {
    return this.paymentsService.getMinutePricing();
  }

  @Post('minutes/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase chat minutes at $1 per minute' })
  @ApiResponse({ status: 201, description: 'Minutes purchased successfully', type: PurchaseMinutesResponseDto })
  async purchaseMinutes(
    @Request() req,
    @Body() purchaseMinutesDto: PurchaseMinutesDto
  ): Promise<PurchaseMinutesResponseDto> {
    return this.paymentsService.purchaseMinutes(req.user.userId, purchaseMinutesDto);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment transaction' })
  @ApiResponse({ status: 201, description: 'Payment transaction created' })
  async createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    const paymentProvider = {
      name: createPaymentDto.provider,
      paymentMethodId: createPaymentDto.paymentMethodId,
      transactionId: '', // Will be filled by payment processor
      customerId: req.user.userId,
    };

    return this.paymentsService.createTransaction(
      req.user.userId,
      createPaymentDto.planId,
      paymentProvider,
    );
  }

  @Post('webhook/success/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process successful payment webhook' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processSuccessfulPayment(@Param('transactionId') transactionId: string) {
    try {
      await this.paymentsService.processSuccessfulPayment(transactionId);
      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('consume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume user credits' })
  @ApiResponse({ status: 200, description: 'Credits consumed successfully' })
  async consumeCredits(@Request() req, @Body() consumeCreditsDto: ConsumeCreditsDto) {
    const success = await this.paymentsService.consumeCredits(
      req.user.userId,
      consumeCreditsDto.type,
      consumeCreditsDto.amount,
    );

    if (!success) {
      throw new BadRequestException('Insufficient credits');
    }

    return { success: true, message: 'Credits consumed successfully' };
  }

  @Get('history/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactionHistory(@Param('userId') userId: string) {
    return this.paymentsService.getTransactionHistory(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: 200, description: 'User transaction history' })
  async getUserTransactions(@Request() req) {
    return this.paymentsService.getUserTransactions(req.user.userId);
  }

  // Confirmo Crypto Payment Endpoints
  @Post('crypto/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase with cryptocurrency via Confirmo' })
  @ApiResponse({ status: 201, description: 'Crypto payment invoice created', type: ConfirmoPaymentResponseDto })
  async purchaseWithCrypto(
    @Request() req,
    @Body() purchaseDto: PurchaseWithConfirmoDto
  ): Promise<ConfirmoPaymentResponseDto> {
    return this.paymentsService.purchaseWithConfirmo(req.user.userId, purchaseDto);
  }

  @Get('crypto/currencies')
  @ApiOperation({ summary: 'Get supported cryptocurrencies' })
  @ApiResponse({ status: 200, description: 'List of supported cryptocurrencies' })
  async getSupportedCryptocurrencies() {
    return this.paymentsService.getSupportedCryptocurrencies();
  }

  @Get('crypto/status')
  @ApiOperation({ summary: 'Get Confirmo integration status' })
  @ApiResponse({ status: 200, description: 'Confirmo configuration status' })
  async getConfirmoStatus() {
    return this.paymentsService.getConfirmoStatus();
  }

  @Post('webhook/confirmo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmo webhook endpoint for payment notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleConfirmoWebhook(@Body() webhookData: ConfirmoWebhookDto) {
    try {
      const result = await this.paymentsService.processConfirmoWebhook(webhookData);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Stripe Payment Endpoints
  @Post('stripe/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Stripe payment intent for purchasing chat minutes' })
  @ApiResponse({ status: 201, description: 'Stripe payment intent created', type: StripePaymentResponseDto })
  async createStripePayment(
    @Request() req,
    @Body() purchaseDto: CreateStripePaymentDto
  ): Promise<StripePaymentResponseDto> {
    return this.paymentsService.createStripePayment(req.user.userId, purchaseDto);
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint for payment notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(@Request() req) {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;
      
      if (!signature) {
        throw new BadRequestException('Missing Stripe signature');
      }

      const result = await this.paymentsService.processStripeWebhook(payload, signature);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('stripe/status')
  @ApiOperation({ summary: 'Get Stripe integration status' })
  @ApiResponse({ status: 200, description: 'Stripe configuration status' })
  async getStripeStatus() {
    return this.paymentsService.getStripeStatus();
  }

}
