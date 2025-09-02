import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: twilio.Twilio;
  private fromPhoneNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    this.logger.log(`[TWILIO INIT] Account SID: ${accountSid ? 'SET' : 'NOT SET'}`);
    this.logger.log(`[TWILIO INIT] Auth Token: ${authToken ? 'SET' : 'NOT SET'}`);
    this.logger.log(`[TWILIO INIT] Phone Number: ${this.fromPhoneNumber || 'NOT SET'}`);

    if (accountSid && authToken && this.fromPhoneNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('[TWILIO INIT] ✅ Twilio service initialized successfully');
    } else {
      this.logger.warn('[TWILIO INIT] ❌ Twilio credentials not configured - SMS notifications disabled');
      this.logger.warn('[TWILIO INIT] Missing credentials:', {
        accountSid: !accountSid,
        authToken: !authToken,
        phoneNumber: !this.fromPhoneNumber
      });
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('[TWILIO SMS] ❌ Twilio not configured - cannot send SMS');
      return false;
    }

    try {
      this.logger.log(`[TWILIO SMS] 📤 Sending SMS to ${to}`);
      this.logger.log(`[TWILIO SMS] From: ${this.fromPhoneNumber}`);
      this.logger.log(`[TWILIO SMS] Message: ${message}`);

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to: to,
      });

      this.logger.log(`[TWILIO SMS] ✅ SMS sent successfully to ${to}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`[TWILIO SMS] ❌ Failed to send SMS to ${to}:`, error);
      this.logger.error(`[TWILIO SMS] Error details:`, error.message || error);
      return false;
    }
  }

  async sendAdminNotification(phoneNumbers: string[], message: string): Promise<void> {
    this.logger.log(`[TWILIO ADMIN] 📋 Starting admin notification to ${phoneNumbers.length} numbers`);
    this.logger.log(`[TWILIO ADMIN] Phone numbers:`, phoneNumbers);

    if (!phoneNumbers || phoneNumbers.length === 0) {
      this.logger.warn('[TWILIO ADMIN] ❌ No phone numbers provided for admin notification');
      return;
    }

    const promises = phoneNumbers.map(phoneNumber => 
      this.sendSMS(phoneNumber, message)
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    const failed = results.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && result.value === false)
    ).length;

    this.logger.log(`[TWILIO ADMIN] 📊 Admin SMS notifications completed: ${successful}/${phoneNumbers.length} successful, ${failed} failed`);
    
    if (failed > 0) {
      this.logger.warn(`[TWILIO ADMIN] ⚠️ Some SMS notifications failed. Check individual SMS logs above for details.`);
    }
  }
}
