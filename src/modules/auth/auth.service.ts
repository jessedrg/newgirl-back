import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from '../../schemas/user.schema';
import { RegisterDto, LoginDto, RegisterResponseDto, LoginResponseDto, ResendVerificationDto, ResendVerificationResponseDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, firstName, lastName, dateOfBirth, acceptTerms, acceptPrivacy } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists',
          field: 'email'
        }
      });
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AGE_REQUIREMENT_NOT_MET',
          message: 'You must be at least 18 years old to register',
          field: 'dateOfBirth'
        }
      });
    }

    // Validate terms acceptance
    if (!acceptTerms || !acceptPrivacy) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TERMS_NOT_ACCEPTED',
          message: 'You must accept the terms of service and privacy policy'
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      profile: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        dateOfBirth: birthDate,
      },
      status: 'pending_verification',
      emailVerified: false,
      preferences: {
        language: 'en-US',
        theme: 'dark',
        privacy: {
          profileVisibility: 'private',
          showOnlineStatus: false,
          allowDataExport: true
        },
        notifications: {
          email: true,
          push: true,
          marketing: registerDto.marketingConsent || false,
          newFeatures: true
        }
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0
      }
    });

    const savedUser = await user.save();

    // Generate verification token
    const verificationToken = this.jwtService.sign(
      { userId: savedUser._id, type: 'email_verification' },
      { expiresIn: '24h' }
    );

    // Send verification email
    console.log(`🔄 AuthService: About to call emailService.sendVerificationEmail`);
    console.log(`📧 Email: ${email}, FirstName: ${firstName}, TokenLength: ${verificationToken.length}`);
    
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken, firstName);
      console.log(`✅ AuthService: Email service call completed successfully`);
    } catch (error) {
      console.error(`❌ AuthService: Email service call failed:`, error);
      throw error;
    }

    return {
      success: true,
      message: 'Registration successful. Please check your email.',
      userId: savedUser._id.toString(),
      verificationRequired: true,
      verificationMethod: 'email'
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, rememberMe } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email, deletedAt: null }).exec();
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in'
        }
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended'
        }
      });
    }

    // Check if account is locked
    if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed login attempts',
          retryAfter: Math.ceil((user.security.lockedUntil.getTime() - Date.now()) / 1000)
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.security.failedLoginAttempts += 1;
      
      // Lock account after 10 failed attempts
      if (user.security.failedLoginAttempts >= 10) {
        user.security.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Reset failed login attempts on successful login
    user.security.failedLoginAttempts = 0;
    user.security.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const payload = { userId: user._id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    // TODO: Store refresh token in Redis
    // await this.redisService.setRefreshToken(user._id, refreshToken, deviceInfo);

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        profile: user.profile
      },
      subscription: {
        tier: 'free', // TODO: Get from subscription service
        status: 'active'
      },
      expiresIn: 900 // 15 minutes
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // TODO: Verify token exists in Redis
      // const storedToken = await this.redisService.getRefreshToken(payload.userId);
      // if (!storedToken || storedToken !== refreshToken) {
      //   throw new UnauthorizedException('Invalid refresh token');
      // }

      // Generate new access token
      const newPayload = { userId: payload.userId, email: payload.email };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });

      return {
        accessToken,
        expiresIn: 900
      };
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }
  }

  async logout(userId: string, refreshToken: string): Promise<{ success: boolean }> {
    // TODO: Remove refresh token from Redis
    // await this.redisService.removeRefreshToken(userId);
    
    // TODO: Add access token to blacklist
    // await this.redisService.blacklistToken(accessToken);

    return { success: true };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'email_verification') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userModel.findById(payload.userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.emailVerified) {
        return {
          success: true,
          message: 'Email already verified'
        };
      }

      user.emailVerified = true;
      user.status = 'active';
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }
  }

  async resendVerification(resendDto: ResendVerificationDto): Promise<ResendVerificationResponseDto> {
    const { email } = resendDto;

    // Find the user
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email address',
          field: 'email'
        }
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_VERIFIED',
          message: 'Email address is already verified'
        }
      });
    }

    // Check if user account is active (not suspended/banned)
    if (user.status === 'suspended' || user.status === 'banned') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended. Please contact support.'
        }
      });
    }

    // Generate new verification token
    const verificationToken = this.jwtService.sign(
      { userId: user._id, type: 'email_verification' },
      { expiresIn: '24h' }
    );

    // Send verification email
    console.log(`🔄 ResendVerification: About to call emailService.sendVerificationEmail`);
    console.log(`📧 Email: ${email}, FirstName: ${user.profile.firstName}, TokenLength: ${verificationToken.length}`);
    
    try {
      await this.emailService.sendVerificationEmail(
        email, 
        verificationToken, 
        user.profile.firstName
      );
      console.log(`✅ ResendVerification: Email service call completed successfully`);
    } catch (error) {
      console.error(`❌ ResendVerification: Email service call failed:`, error);
      throw error;
    }

    return {
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    };
  }

  async initiateOAuth(provider: string, redirectUrl?: string): Promise<{ authUrl: string; state: string }> {
    const state = uuidv4();
    
    // TODO: Store state in Redis for CSRF protection
    // await this.redisService.setOAuthState(state, { provider, redirectUrl });

    let authUrl: string;
    
    switch (provider) {
      case 'google':
        authUrl = `https://accounts.google.com/oauth/authorize?` +
          `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
          `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
          `response_type=code&` +
          `scope=openid email profile&` +
          `state=${state}`;
        break;
      case 'facebook':
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${process.env.FACEBOOK_CLIENT_ID}&` +
          `redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&` +
          `response_type=code&` +
          `scope=email&` +
          `state=${state}`;
        break;
      default:
        throw new BadRequestException('Unsupported OAuth provider');
    }

    return { authUrl, state };
  }
}
