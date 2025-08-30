import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentTransaction, PaymentTransactionDocument } from '../../../schemas/payment-transaction.schema';
import { CreateConfirmoInvoiceDto, ConfirmoPaymentResponseDto, ConfirmoWebhookDto } from '../dto/confirmo.dto';

@Injectable()
export class ConfirmoService {
  private readonly logger = new Logger(ConfirmoService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly callbackPassword: string;
  private readonly webhookUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(PaymentTransaction.name) private transactionModel: Model<PaymentTransactionDocument>,
  ) {
    this.apiUrl = this.configService.get<string>('CONFIRMO_API_URL') || 'https://confirmo.net/api/v3';
    this.apiKey = this.configService.get<string>('CONFIRMO_API_KEY');
    this.callbackPassword = this.configService.get<string>('CONFIRMO_CALLBACK_PASSWORD');
    this.webhookUrl = this.configService.get<string>('CONFIRMO_WEBHOOK_URL');

    if (!this.apiKey) {
      this.logger.warn('CONFIRMO_API_KEY not configured. Confirmo payments will not work.');
    }
  }

  /**
   * Create a new Confirmo invoice for crypto payment
   */
  async createInvoice(
    userId: string,
    invoiceData: CreateConfirmoInvoiceDto,
    transactionId?: string
  ): Promise<ConfirmoPaymentResponseDto> {
    try {
      const payload = {
        invoice: {
          amount: invoiceData.amount,
          currencyFrom: invoiceData.currencyFrom,
          currencyTo: invoiceData.currencyTo || null, // null allows customer to choose
        },
        settlement: {
          currency: invoiceData.settlementCurrency || null, // null keeps in crypto
        },
        reference: invoiceData.reference,
        notifyUrl: this.webhookUrl,
        callbackPassword: this.callbackPassword,
        customerEmail: invoiceData.customerEmail,
      };

      this.logger.debug('Creating Confirmo invoice:', payload);

      const response = await fetch(`${this.apiUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Confirmo API error:', errorText);
        throw new BadRequestException(`Confirmo API error: ${response.status} ${errorText}`);
      }

      const confirmoInvoice = await response.json();
      this.logger.debug('Confirmo invoice created:', confirmoInvoice);

      // Store the Confirmo invoice ID in our transaction
      if (transactionId) {
        await this.transactionModel.findByIdAndUpdate(transactionId, {
          'provider.transactionId': confirmoInvoice.id,
          'provider.name': 'confirmo',
        });
      }

      return {
        success: true,
        invoiceId: confirmoInvoice.id,
        paymentUrl: confirmoInvoice.url,
        qrCode: confirmoInvoice.qrCode || confirmoInvoice.url, // Fallback to URL if no QR
        expiresAt: confirmoInvoice.expires,
        transactionId: transactionId || confirmoInvoice.id,
      };

    } catch (error) {
      this.logger.error('Failed to create Confirmo invoice:', error);
      throw new BadRequestException('Failed to create crypto payment invoice');
    }
  }

  /**
   * Process Confirmo webhook notification
   */
  async processWebhook(webhookData: ConfirmoWebhookDto): Promise<{ success: boolean; message: string }> {
    try {
      // Verify callback password if configured
      if (this.callbackPassword && webhookData.callbackPassword !== this.callbackPassword) {
        this.logger.warn('Invalid callback password in Confirmo webhook');
        throw new BadRequestException('Invalid callback password');
      }

      const { invoice } = webhookData;
      this.logger.debug(`Processing Confirmo webhook for invoice ${invoice.id}, status: ${invoice.status}`);

      // Find our transaction by Confirmo invoice ID
      const transaction = await this.transactionModel.findOne({
        'provider.transactionId': invoice.id,
        'provider.name': 'confirmo',
      });

      if (!transaction) {
        this.logger.warn(`Transaction not found for Confirmo invoice ${invoice.id}`);
        return { success: false, message: 'Transaction not found' };
      }

      // Update transaction based on invoice status
      switch (invoice.status) {
        case 'prepared':
          transaction.status = 'pending';
          break;

        case 'paid':
          transaction.status = 'completed';
          transaction.completedAt = new Date(invoice.paid);
          transaction.creditsApplied = false; // Will be processed by payment service
          
          // Store crypto payment details
          if (invoice.txHash) {
            transaction.provider.transactionId = invoice.txHash; // Store blockchain tx hash
          }
          break;

        case 'expired':
          transaction.status = 'cancelled';
          transaction.failureReason = 'Invoice expired';
          break;

        case 'cancelled':
          transaction.status = 'cancelled';
          transaction.failureReason = 'Payment cancelled';
          break;

        case 'refunded':
          transaction.status = 'refunded';
          transaction.refundedAt = new Date();
          break;

        default:
          this.logger.warn(`Unknown Confirmo invoice status: ${invoice.status}`);
          return { success: false, message: `Unknown status: ${invoice.status}` };
      }

      await transaction.save();
      this.logger.log(`Updated transaction ${transaction._id} to status: ${transaction.status}`);

      return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
      this.logger.error('Failed to process Confirmo webhook:', error);
      throw new BadRequestException('Failed to process webhook');
    }
  }

  /**
   * Get invoice status from Confirmo API
   */
  async getInvoiceStatus(invoiceId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to get invoice status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to get Confirmo invoice status:', error);
      throw error;
    }
  }

  /**
   * Get supported cryptocurrencies from Confirmo
   */
  async getSupportedAssets(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/assets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to get supported assets: ${response.status}`);
      }

      const assets = await response.json();
      return assets.filter((asset: any) => asset.paymentAsset === true);
    } catch (error) {
      this.logger.error('Failed to get Confirmo supported assets:', error);
      return [];
    }
  }

  /**
   * Validate Confirmo configuration
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.webhookUrl);
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): { configured: boolean; apiUrl: string; webhookUrl: string } {
    return {
      configured: this.isConfigured(),
      apiUrl: this.apiUrl,
      webhookUrl: this.webhookUrl || 'Not configured',
    };
  }
}
