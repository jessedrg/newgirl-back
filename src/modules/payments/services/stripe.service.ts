import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured - Stripe payments will be disabled');
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  /**
   * Create a payment intent for purchasing chat minutes
   */
  async createPaymentIntent(
    userId: string,
    quantity: number,
    customerEmail?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    if (quantity < 1 || quantity > 500) {
      throw new BadRequestException('Quantity must be between 1 and 500 minutes');
    }

    const amount = quantity * 100; // $1 per minute in cents
    const description = `${quantity} chat minutes at $1.00 per minute`;

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        description,
        metadata: {
          userId,
          quantity: quantity.toString(),
          type: 'chat_minutes',
          ...metadata,
        },
        receipt_email: customerEmail,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      this.logger.log(`Created payment intent ${paymentIntent.id} for user ${userId}: ${quantity} minutes`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Retrieve a payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException('Payment intent not found');
    }
  }

  /**
   * Process Stripe webhook events with proper signature verification
   */
  async processWebhook(
    payload: string | any,
    signature: string
  ): Promise<{ success: boolean; event?: Stripe.Event; message: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    // Validate signature format
    if (!signature || !signature.includes('t=') || !signature.includes('v1=')) {
      this.logger.error('Invalid Stripe signature format');
      return {
        success: false,
        message: 'Invalid webhook signature format'
      };
    }
  
    // For development/testing - skip signature verification if no webhook secret
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret not configured - skipping signature verification (DEVELOPMENT ONLY)');
      
      try {
        // Parse the payload as JSON to get the event
        const eventData = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
        
        this.logger.log(`Received Stripe webhook (no verification): ${eventData.type}`);
        
        return {
          success: true,
          event: eventData,
          message: `Webhook ${eventData.type} processed successfully (no verification)`
        };
      } catch (error) {
        this.logger.error('Failed to parse webhook payload:', error);
        return {
          success: false,
          message: 'Failed to parse webhook payload'
        };
      }
    }

    try {
      // Ensure we have the raw request body as Buffer for signature verification
      const rawBody = Buffer.isBuffer(payload) ? payload : Buffer.from(payload as string, 'utf8');
      
      // Construct and verify the event using Stripe's official method
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      
      this.logger.log(`✅ Stripe webhook verified: ${event.type} (${event.id})`);
      
      return {
        success: true,
        event,
        message: `Webhook ${event.type} processed successfully`
      };
    } catch (error) {
      // Enhanced error logging for signature verification failures
      if (error.message?.includes('No signatures found matching')) {
        this.logger.error('❌ Stripe webhook signature verification failed: No matching signatures found');
        this.logger.error('Check that you are using the correct webhook secret from your Stripe Dashboard');
        this.logger.error('Webhook secret should start with "whsec_" and match your endpoint configuration');
      } else if (error.message?.includes('timestamp')) {
        this.logger.error('❌ Stripe webhook signature verification failed: Timestamp issue');
        this.logger.error('This could indicate a replay attack or clock synchronization issue');
      } else {
        this.logger.error('❌ Stripe webhook signature verification failed:', error.message);
      }
      
      return {
        success: false,
        message: `Webhook signature verification failed: ${error.message}`
      };
    }
  }

  /**
   * Get Stripe configuration status
   */
  getConfigStatus(): { configured: boolean; webhookConfigured: boolean } {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    return {
      configured: !!secretKey,
      webhookConfigured: !!webhookSecret
    };
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(email: string, userId: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });

      this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer:', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Get or create a customer by email
   */
  async getOrCreateCustomer(email: string, userId: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      // First, try to find existing customer by email
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        this.logger.log(`Found existing Stripe customer ${customer.id} for email ${email}`);
        return customer;
      }

      // Create new customer if none found
      return await this.createCustomer(email, userId);
    } catch (error) {
      this.logger.error('Failed to get or create Stripe customer:', error);
      throw new BadRequestException('Failed to get or create customer');
    }
  }
}
