import { IsEmail, IsString, IsBoolean, IsOptional, IsDateString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character'
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1995-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  acceptTerms: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  acceptPrivacy: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @ApiProperty({ example: 'FRIEND123', required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  deviceInfo?: {
    platform: string;
    userAgent: string;
    ipAddress: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Registration successful. Please check your email.' })
  message: string;

  @ApiProperty({ example: '64f8b2c4e1234567890abcde' })
  userId: string;

  @ApiProperty({ example: true })
  verificationRequired: boolean;

  @ApiProperty({ example: 'email' })
  verificationMethod: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    profile: any;
  };

  @ApiProperty()
  subscription: {
    tier: string;
    status: string;
  };

  @ApiProperty({ example: 900 })
  expiresIn: number;
}

export class OAuthInitiateResponseDto {
  @ApiProperty({ example: 'https://accounts.google.com/oauth/authorize?...' })
  authUrl: string;

  @ApiProperty({ example: 'csrf_protection_token_abc123' })
  state: string;

  @ApiProperty({ example: 'pkce_verifier_for_mobile_apps', required: false })
  codeVerifier?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty()
  error: {
    code: string;
    message: string;
    field?: string;
    retryAfter?: number;
  };
}
