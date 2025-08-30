# Simplified NewGirl Backend

## Overview
The backend has been simplified to focus on core functionality: **Authentication** and **Payments/Credits System** for managing user minutes, image purchases, and tips.

## Core Modules

### 1. Authentication (`/modules/auth/`)
- User registration and login
- JWT token management
- Email verification
- Password reset functionality

### 2. Users (`/modules/users/`)
- User profile management
- User data operations

### 3. Payments (`/modules/payments/`)
- **NEW**: Simplified payment system
- Manages user credits for:
  - Chat minutes
  - Image purchase credits
  - Tip credits
- Payment plan management
- Transaction processing

### 4. Email (`/modules/email/`)
- Email notifications
- Verification emails
- Password reset emails

## New Payment System

### Schemas
- **PaymentPlan**: Defines available payment plans with features (minutes, image credits, tip credits)
- **UserWallet**: Tracks user's credit balance and usage statistics
- **PaymentTransaction**: Records all payment transactions and their status

### Key Features
- **Credit-based system**: Users purchase credits for different activities
- **Flexible payment plans**: One-time purchases or subscriptions
- **Usage tracking**: Monitor how users spend their credits
- **Transaction history**: Complete audit trail of all payments

### API Endpoints
- `GET /payments/plans` - Get available payment plans
- `GET /payments/wallet` - Get user's wallet/credit balance
- `POST /payments/purchase` - Create a payment transaction
- `POST /payments/consume` - Consume user credits
- `GET /payments/transactions` - Get transaction history

## Removed Modules
The following modules were removed to simplify the backend:
- Girlfriends management
- Messages/Chat system
- Stock girlfriends
- User saved girlfriends
- Usage tracking (now part of wallet)
- Subscription events
- Generated images
- Platform analytics
- Webhook events

## Database Schema Focus
- **Users**: Core user data
- **PaymentPlans**: Available purchase options
- **UserWallets**: User credit balances and usage
- **PaymentTransactions**: Payment history and status

## Next Steps
1. Implement payment provider integration (Stripe, PayPal, etc.)
2. Add rate limiting for credit consumption
3. Implement subscription renewal logic
4. Add admin endpoints for plan management
5. Set up webhook handlers for payment providers

This simplified architecture focuses on the core business model: users purchasing credits to interact with AI models through chat, image generation, and tipping.
