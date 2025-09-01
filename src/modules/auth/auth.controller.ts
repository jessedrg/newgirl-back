import { Controller, Post, Get, Body, Query, Param, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshTokenDto,
  RegisterResponseDto,
  LoginResponseDto,
  ResendVerificationDto,
  ResendVerificationResponseDto,
  OAuthInitiateResponseDto,
  ErrorResponseDto 
} from './dto/auth.dto';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Registration successful', type: RegisterResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Authenticate user and establish session' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request
  ): Promise<LoginResponseDto> {
    // Add device info from request
    const deviceInfo = {
      platform: 'web',
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    };
    
    return this.authService.login({ ...loginDto, deviceInfo });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token', type: ErrorResponseDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Body() body: { refreshToken: string }
  ) {
    // TODO: Extract userId from JWT token in request
    const userId = 'extracted_from_jwt'; // This will be implemented with JWT guard
    return this.authService.logout(userId, body.refreshToken);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification token', type: ErrorResponseDto })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully', type: ResendVerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - user not found, already verified, or account suspended', type: ErrorResponseDto })
  async resendVerification(@Body() resendDto: ResendVerificationDto): Promise<ResendVerificationResponseDto> {
    console.log(`✅ ResendVerification: Email service call completed successfully`);
    return this.authService.resendVerification(resendDto);
    
  }

  @Get('oauth/:provider/initiate')
  @ApiOperation({ summary: 'Initiate OAuth flow' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated', type: OAuthInitiateResponseDto })
  @ApiResponse({ status: 400, description: 'Unsupported provider', type: ErrorResponseDto })
  async initiateOAuth(
    @Param('provider') provider: string,
    @Query('redirectUrl') redirectUrl?: string
  ): Promise<OAuthInitiateResponseDto> {
    const result = await this.authService.initiateOAuth(provider, redirectUrl);
    return {
      authUrl: result.authUrl,
      state: result.state
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth(@Req() req: Request) {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Handle Google OAuth callback (GET)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens or error' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = req.user;
      
      if (result.success) {
        // Redirect to frontend with tokens
        const queryParams = new URLSearchParams({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires_in: result.expiresIn.toString()
        });
        
        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${queryParams.toString()}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
    }
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback (POST)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens or error' })
  async googleAuthCallbackPost(@Req() req: any, @Res() res: Response, @Body() body: any) {
    try {
      console.log('POST callback body:', body);
      
      // Extract code from POST body
      const { code, state } = body;
      
      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=missing_code`);
      }

      // Manually exchange code for tokens and create user
      // We'll bypass Passport and handle this directly
      const result = await this.authService.handleGoogleCallback(code, state);
      
      if (result.success) {
        const queryParams = new URLSearchParams({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires_in: result.expiresIn.toString()
        });
        
        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${queryParams.toString()}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
      }
    } catch (error) {
      console.error('Google OAuth POST callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
    }
  }

  @Get('oauth/:provider/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens or error' })
  async handleOAuthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Query('error') error?: string
  ) {
    try {
      if (error) {
        // OAuth provider returned an error
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${error}`);
      }

      // TODO: Implement OAuth callback processing
      // 1. Validate state parameter
      // 2. Exchange code for access token
      // 3. Fetch user profile
      // 4. Create or link account
      // 5. Generate internal tokens
      
      // For now, redirect with placeholder
      return res.redirect(`${process.env.FRONTEND_URL}/auth/success?provider=${provider}`);
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
    }
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 429, description: 'Too many requests', type: ErrorResponseDto })
  async forgotPassword(@Body() body: { email: string }) {
    // TODO: Implement password reset
    return {
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.'
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid reset token', type: ErrorResponseDto })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    // TODO: Implement password reset
    return {
      success: true,
      message: 'Password reset successful'
    };
  }
}
