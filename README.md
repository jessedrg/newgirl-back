# NewGirl Platform - Core Backend Service

A comprehensive NestJS backend service for the NewGirl AI girlfriend platform, featuring secure authentication, MongoDB integration, and comprehensive user management.

## Features

### 🔐 Authentication System
- **Secure Registration**: Email verification, password strength validation, age verification (18+)
- **JWT Authentication**: Access tokens (15min) and refresh tokens (7-30 days)
- **OAuth Integration**: Google, Facebook, and Apple Sign-In
- **Security Features**: Rate limiting, account lockout, brute force protection
- **Session Management**: Multi-device support with Redis-backed sessions

### 📊 Database Schema
- **Users**: Complete user profiles with preferences and security settings
- **Girlfriends**: Custom AI girlfriend configurations and personalities
- **Messages**: Chat conversations with AI context and moderation
- **Stock Girlfriends**: Pre-made AI girlfriend templates
- **Subscriptions**: Payment plans and billing management
- **Analytics**: Usage tracking and platform metrics

### 🛡️ Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT tokens with HMAC SHA-256 signing
- Rate limiting and CSRF protection
- Input validation and sanitization
- Secure headers with Helmet
- Account lockout after failed attempts

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Redis 6+ (for sessions and rate limiting)
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd newgirl
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required Environment Variables**:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/newgirl

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... (see .env.example for full list)
```

4. **Start the application**:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "rememberMe": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "userId": "user_id_here"
}
```

#### POST `/auth/login`
Authenticate user and establish session.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Response**:
```json
{
  "success": true,
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "emailVerified": true
  }
}
```

#### POST `/auth/refresh`
Refresh access token using refresh token.

#### GET `/auth/verify-email?token=verification_token`
Verify email address with token.

#### GET `/auth/oauth/{provider}/initiate`
Initiate OAuth flow (Google, Facebook, Apple).

#### GET `/auth/oauth/{provider}/callback`
Handle OAuth provider callback.

## Database Schema

### Users Collection
```typescript
{
  email: string;           // Unique, required
  password: string;        // Hashed with bcrypt
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    avatar?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: object;
  };
  security: {
    emailVerified: boolean;
    lastLogin: Date;
    failedLoginAttempts: number;
    accountLockedUntil?: Date;
  };
  subscription: {
    plan: string;
    status: string;
    expiresAt?: Date;
  };
  // ... additional fields
}
```

### Girlfriends Collection
```typescript
{
  userId: ObjectId;        // Reference to Users
  name: string;
  personality: {
    traits: string[];
    backstory: string;
    interests: string[];
  };
  appearance: {
    physicalTraits: object;
    style: object;
  };
  aiConfig: {
    model: string;
    temperature: number;
    systemPrompt: string;
  };
  // ... additional fields
}
```

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens signed with HMAC SHA-256
- Refresh token rotation on use
- Account lockout after 10 failed attempts (30 minutes)
- Rate limiting on auth endpoints

### Data Protection
- Input validation with class-validator
- SQL injection prevention with Mongoose
- XSS protection with sanitization
- CSRF protection for OAuth flows
- Secure headers with Helmet

### Session Management
- Redis-backed session storage
- Multi-device session tracking
- Secure logout with token invalidation
- Session expiration and cleanup

## Development

### Project Structure
```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication module
│   ├── users/        # User management
│   ├── girlfriends/  # AI girlfriend management
│   └── ...
├── schemas/          # MongoDB schemas
├── common/           # Shared utilities
└── main.ts          # Application entry point
```

### Available Scripts
```bash
npm run start:dev     # Development server with hot reload
npm run build         # Build for production
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Database connections (MongoDB, Redis)
- JWT secrets (use strong, unique keys)
- OAuth credentials
- Email service configuration
- Security settings

### Production Considerations
- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS settings
- Set up monitoring and logging
- Regular security updates
- Database backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For technical support or questions, please contact the development team.
