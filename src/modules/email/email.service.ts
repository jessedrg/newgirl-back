import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.logger.log(`🔧 EmailService constructor called`);
    this.createTransporter();
    this.logger.log(`✅ EmailService initialized successfully`);
  }

  private createTransporter() {
    this.logger.log(`🔧 Creating email transporter...`);
    this.logger.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
    
    // For development, we'll use a simple SMTP configuration
    // In production, you'd use services like SendGrid, AWS SES, etc.
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`📧 [DEVELOPMENT] Using stream transport (no real emails sent)`);
      // For development, use stream transport to avoid needing real SMTP
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      this.logger.log(`✅ [DEVELOPMENT] Stream transporter created`);
    } else {
      this.logger.log(`📧 [PRODUCTION] Using SMTP transport`);
      const smtpConfig = {
        host: this.configService.get('SMTP_HOST'),
        port: parseInt(this.configService.get('SMTP_PORT', '587')),
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      };
      this.logger.log(`📧 SMTP Config:`, {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        hasUser: !!smtpConfig.auth.user,
        hasPass: !!smtpConfig.auth.pass
      });
      
      // For production, use real SMTP
      this.transporter = nodemailer.createTransport(smtpConfig);
      this.logger.log(`✅ [PRODUCTION] SMTP transporter created`);
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string, firstName: string): Promise<void> {
    this.logger.log(`🚀 Starting sendVerificationEmail for: ${email}`);
    this.logger.log(`👤 First name: ${firstName}`);
    this.logger.log(`🎫 Token length: ${verificationToken.length}`);
    
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    this.logger.log(`🌐 Frontend URL: ${frontendUrl}`);
    this.logger.log(`🔗 Full verification URL: ${verificationUrl}`);

    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'noreply@newgirl.com'),
      to: email,
      subject: 'Welcome to NewGirl - Verify Your Email',
      html: this.getVerificationEmailTemplate(firstName, verificationUrl),
      text: this.getVerificationEmailText(firstName, verificationUrl),
    };

    this.logger.log(`📧 Mail options prepared:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    });

    try {
      this.logger.log(`🔧 Environment: ${process.env.NODE_ENV}`);
      
      if (process.env.NODE_ENV === 'development') {
        // In development, just log the email instead of sending
        this.logger.log(`📧 [DEVELOPMENT] Verification email would be sent to: ${email}`);
        this.logger.log(`🔗 [DEVELOPMENT] Verification URL: ${verificationUrl}`);
        this.logger.log(`📝 [DEVELOPMENT] Email text content:`);
        this.logger.log(mailOptions.text);
        this.logger.log(`✅ [DEVELOPMENT] Email "sent" successfully (logged only)`);
      } else {
        this.logger.log(`📤 Attempting to send email via SMTP...`);
        const result = await this.transporter.sendMail(mailOptions);
        this.logger.log(`✅ Verification email sent to ${email}: ${result.messageId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send verification email to ${email}:`, error);
      this.logger.error(`❌ Error details:`, error.stack);
      throw new Error('Failed to send verification email');
    }
    
    this.logger.log(`🏁 Finished sendVerificationEmail for: ${email}`);
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'noreply@newgirl.com'),
      to: email,
      subject: 'NewGirl - Password Reset Request',
      html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
      text: this.getPasswordResetEmailText(firstName, resetUrl),
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`📧 Password reset email would be sent to: ${email}`);
        this.logger.log(`🔗 Reset URL: ${resetUrl}`);
      } else {
        const result = await this.transporter.sendMail(mailOptions);
        this.logger.log(`✅ Password reset email sent to ${email}: ${result.messageId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NewGirl</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NewGirl!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for joining NewGirl! We're excited to have you on board.</p>
            <p>To complete your registration and start creating your AI girlfriend, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify My Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with NewGirl, please ignore this email.</p>
            
            <p>Welcome aboard!<br>The NewGirl Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewGirl. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationEmailText(firstName: string, verificationUrl: string): string {
    return `
Hi ${firstName},

Welcome to NewGirl! Thank you for joining us.

To complete your registration, please verify your email address by visiting this link:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with NewGirl, please ignore this email.

Welcome aboard!
The NewGirl Team

© 2024 NewGirl. All rights reserved.
    `.trim();
  }

  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - NewGirl</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password for your NewGirl account.</p>
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            
            <p><strong>This reset link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The NewGirl Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewGirl. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(firstName: string, resetUrl: string): string {
    return `
Hi ${firstName},

We received a request to reset your password for your NewGirl account.

To reset your password, please visit this link:
${resetUrl}

This reset link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The NewGirl Team

© 2024 NewGirl. All rights reserved.
    `.trim();
  }
}
