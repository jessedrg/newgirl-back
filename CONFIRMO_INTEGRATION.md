# 🚀 Confirmo Crypto Payment Gateway Integration

## 📋 Overview

Your NewGirl backend now supports **cryptocurrency payments** via Confirmo for both:
- **Fixed Payment Plans** (Starter, Popular, Premium packs)
- **Dynamic Minute Purchases** ($1 per minute, 1-500 minutes)

## 🔧 Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Confirmo API Configuration
CONFIRMO_API_KEY=your_confirmo_api_key_here
CONFIRMO_API_URL=https://confirmo.net/api/v3
CONFIRMO_CALLBACK_PASSWORD=your_secure_callback_password
CONFIRMO_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook/confirmo

# Example:
# CONFIRMO_API_KEY=cfm_live_abc123def456...
# CONFIRMO_CALLBACK_PASSWORD=super_secure_password_123
# CONFIRMO_WEBHOOK_URL=https://newgirl-api.com/api/payments/webhook/confirmo
```

## 🔗 API Endpoints

### **1. Purchase with Crypto**
```
POST /payments/crypto/purchase
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "type": "minutes",              // "plan" or "minutes"
  "quantity": 30,                 // Required for minutes (1-500)
  "planId": "plan_id_here",       // Required for plan purchases
  "preferredCurrency": "BTC",     // Optional: BTC, LTC, etc. (null = customer choice)
  "customerEmail": "user@example.com"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "inv_123456789",
  "paymentUrl": "https://confirmo.net/invoice/inv_123456789",
  "qrCode": "bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.0005",
  "expiresAt": "2024-01-15T10:30:00Z",
  "transactionId": "txn_internal_123"
}
```

### **2. Get Supported Cryptocurrencies**
```
GET /payments/crypto/currencies
```

**Response:**
```json
[
  {
    "code": "BTC",
    "name": "Bitcoin",
    "network": "mainnet",
    "paymentAsset": true
  },
  {
    "code": "LTC",
    "name": "Litecoin",
    "network": "mainnet",
    "paymentAsset": true
  }
]
```

### **3. Check Integration Status**
```
GET /payments/crypto/status
```

**Response:**
```json
{
  "configured": true,
  "apiUrl": "https://confirmo.net/api/v3",
  "webhookUrl": "https://yourdomain.com/api/payments/webhook/confirmo"
}
```

### **4. Webhook Endpoint** (Internal)
```
POST /payments/webhook/confirmo
```
This endpoint receives payment notifications from Confirmo automatically.

## 💻 Frontend Integration Examples

### **React/Next.js Crypto Purchase Component:**

```tsx
// hooks/useCryptoPurchase.ts
import { useState } from 'react';
import { useAuth } from './useAuth';

interface CryptoPurchaseRequest {
  type: 'plan' | 'minutes';
  planId?: string;
  quantity?: number;
  preferredCurrency?: string;
  customerEmail?: string;
}

export const useCryptoPurchase = () => {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const purchaseWithCrypto = async (request: CryptoPurchaseRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/crypto/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Crypto purchase failed');
      }

      const result = await response.json();
      
      // Redirect user to Confirmo payment page
      window.open(result.paymentUrl, '_blank');
      
      return result;
    } catch (error) {
      console.error('Crypto purchase failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { purchaseWithCrypto, loading };
};
```

### **Crypto Payment Button Component:**

```tsx
// components/CryptoPaymentButton.tsx
import React from 'react';
import { useCryptoPurchase } from '../hooks/useCryptoPurchase';

interface Props {
  type: 'plan' | 'minutes';
  planId?: string;
  quantity?: number;
  amount: number;
  onSuccess?: () => void;
}

export const CryptoPaymentButton: React.FC<Props> = ({ 
  type, 
  planId, 
  quantity, 
  amount,
  onSuccess 
}) => {
  const { purchaseWithCrypto, loading } = useCryptoPurchase();

  const handleCryptoPurchase = async () => {
    try {
      const result = await purchaseWithCrypto({
        type,
        planId,
        quantity,
        preferredCurrency: null, // Let user choose
      });

      // Show success message
      alert(`Payment initiated! Invoice ID: ${result.invoiceId}`);
      onSuccess?.();
      
    } catch (error) {
      alert('Crypto payment failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleCryptoPurchase}
      disabled={loading}
      className="crypto-pay-btn"
    >
      {loading ? (
        'Creating Invoice...'
      ) : (
        <>
          💰 Pay ${amount.toFixed(2)} with Crypto
        </>
      )}
    </button>
  );
};
```

### **Complete Purchase Flow:**

```tsx
// components/MinutePurchaseWithCrypto.tsx
import React, { useState } from 'react';
import { CryptoPaymentButton } from './CryptoPaymentButton';

export const MinutePurchaseWithCrypto = () => {
  const [quantity, setQuantity] = useState(30);
  const totalAmount = quantity * 1.00; // $1 per minute

  return (
    <div className="crypto-purchase-modal">
      <h2>Purchase Chat Minutes with Crypto</h2>
      
      <div className="quantity-selector">
        <label>Minutes to purchase:</label>
        <input
          type="number"
          min="1"
          max="500"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="pricing-info">
        <p>💰 <strong>${totalAmount.toFixed(2)} USD</strong></p>
        <p>🔄 Converted to crypto at current rates</p>
        <p>⚡ Supports Bitcoin, Litecoin, and more!</p>
      </div>

      <CryptoPaymentButton
        type="minutes"
        quantity={quantity}
        amount={totalAmount}
        onSuccess={() => {
          console.log('Crypto payment initiated successfully!');
          // Optionally close modal or show success state
        }}
      />

      <div className="crypto-benefits">
        <h4>Why pay with crypto?</h4>
        <ul>
          <li>🔒 Enhanced privacy and security</li>
          <li>🌍 Global payments without borders</li>
          <li>⚡ Fast transaction processing</li>
          <li>💸 Lower fees than traditional payments</li>
        </ul>
      </div>
    </div>
  );
};
```

## 🔄 Payment Flow

1. **User initiates crypto purchase** (plan or minutes)
2. **Backend creates Confirmo invoice** with USD amount
3. **User redirected to Confirmo payment page**
4. **User selects cryptocurrency** (BTC, LTC, etc.)
5. **User sends crypto payment** to generated address
6. **Confirmo confirms payment** on blockchain
7. **Webhook notifies backend** of payment completion
8. **Credits automatically added** to user wallet
9. **User can start chatting** with new credits!

## 🔐 Security Features

- **Webhook verification** with callback password
- **JWT authentication** for all purchase endpoints
- **Transaction tracking** with unique IDs
- **Automatic retry logic** for webhook delivery
- **Secure API key management** via environment variables

## 🎯 Supported Cryptocurrencies

- **Bitcoin (BTC)** - Native and Lightning Network
- **Litecoin (LTC)** - Fast and low fees
- **Other cryptos** - Check `/payments/crypto/currencies` endpoint

## 📊 Transaction Monitoring

Monitor crypto payments via:
- **GET /payments/history/:userId** - User transaction history
- **Confirmo Dashboard** - Real-time payment tracking
- **Webhook logs** - Payment notification history

## 🚀 Next Steps

1. **Configure environment variables** with your Confirmo API credentials
2. **Test in sandbox mode** before going live
3. **Implement frontend components** using the examples above
4. **Set up webhook endpoint** for payment notifications
5. **Monitor transactions** and user wallet balances

Your NewGirl platform now supports **seamless cryptocurrency payments** for both fixed plans and dynamic minute purchases! 🎉
