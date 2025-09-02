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

    if (accountSid && authToken && this.fromPhoneNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('Twilio service initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured - SMS notifications disabled');
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured - cannot send SMS');
      return false;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to: to,
      });

      this.logger.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendAdminNotification(phoneNumbers: string[], message: string): Promise<void> {
    if (!phoneNumbers || phoneNumbers.length === 0) {
      this.logger.warn('No phone numbers provided for admin notification');
      return;
    }

    const promises = phoneNumbers.map(phoneNumber => 
      this.sendSMS(phoneNumber, message)
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    this.logger.log(`Admin SMS notifications sent: ${successful}/${phoneNumbers.length} successful`);
  }
}
