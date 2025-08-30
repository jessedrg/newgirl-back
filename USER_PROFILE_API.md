# User Profile API - "Me" Endpoint Documentation

## Overview
The "me" endpoint provides comprehensive user profile information including wallet balance, usage statistics, subscription details, and recent transaction history. This endpoint is now properly located in the **Users module** for better separation of concerns.

## Endpoint Details

### GET /users/me
**Description:** Get complete logged-in user profile with balance, usage, and transaction history

**Authentication:** Required (JWT Bearer token)

**URL:** `GET http://localhost:3000/users/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Response Structure

### Success Response (200)
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastActivity": "2024-01-15T14:30:00.000Z",
  "balance": {
    "chatMinutes": 120,
    "imageCredits": 50,
    "tipCredits": 25
  },
  "usage": {
    "totalChatMinutesUsed": 480,
    "totalImagesGenerated": 125,
    "totalTipsGiven": 15,
    "totalSpent": 2500,
    "totalSpentUSD": 25.00
  },
  "subscription": {
    "hasActiveSubscription": true,
    "subscriptionExpiresAt": "2024-02-15T00:00:00.000Z",
    "daysUntilExpiry": 15,
    "status": "active"
  },
  "recentTransactions": [
    {
      "id": "507f1f77bcf86cd799439012",
      "type": "chat_minutes",
      "amount": 1000,
      "amountUSD": 10.00,
      "status": "completed",
      "provider": "confirmo",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "planName": "Basic Plan",
      "creditsReceived": {
        "chatMinutes": 60,
        "imageCredits": 0,
        "tipCredits": 0
      }
    }
  ],
  "stats": {
    "totalTransactions": 12,
    "memberSince": "January 2024",
    "favoritePaymentMethod": "confirmo"
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Frontend Integration Examples

### React/TypeScript Integration

#### 1. TypeScript Interfaces
```typescript
interface UserBalance {
  chatMinutes: number;
  imageCredits: number;
  tipCredits: number;
}

interface UserUsage {
  totalChatMinutesUsed: number;
  totalImagesGenerated: number;
  totalTipsGiven: number;
  totalSpent: number;
  totalSpentUSD: number;
}

interface UserSubscription {
  hasActiveSubscription: boolean;
  subscriptionExpiresAt?: string;
  daysUntilExpiry?: number;
  status: 'active' | 'expired' | 'none';
}

interface CreditsReceived {
  chatMinutes: number;
  imageCredits: number;
  tipCredits: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  amountUSD: number;
  status: string;
  provider: string;
  createdAt: string;
  planName?: string;
  creditsReceived: CreditsReceived;
}

interface UserStats {
  totalTransactions: number;
  memberSince: string;
  favoritePaymentMethod: string;
}

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  lastActivity: string;
  balance: UserBalance;
  usage: UserUsage;
  subscription: UserSubscription;
  recentTransactions: RecentTransaction[];
  stats: UserStats;
}
```

#### 2. API Service Function
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
    throw error;
  }
};
```

#### 3. React Hook for User Profile
```typescript
import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
};
```

#### 4. React Component Example
```tsx
import React from 'react';
import { useUserProfile } from './hooks/useUserProfile';

const UserDashboard: React.FC = () => {
  const { profile, loading, error, refetch } = useUserProfile();

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile data</div>;

  return (
    <div className="user-dashboard">
      <header className="profile-header">
        <h1>Welcome back, {profile.name}!</h1>
        <p>Member since {profile.stats.memberSince}</p>
      </header>

      <div className="balance-section">
        <h2>Your Balance</h2>
        <div className="balance-cards">
          <div className="balance-card">
            <h3>Chat Minutes</h3>
            <p>{profile.balance.chatMinutes}</p>
          </div>
          <div className="balance-card">
            <h3>Image Credits</h3>
            <p>{profile.balance.imageCredits}</p>
          </div>
          <div className="balance-card">
            <h3>Tip Credits</h3>
            <p>{profile.balance.tipCredits}</p>
          </div>
        </div>
      </div>

      <div className="usage-section">
        <h2>Usage Statistics</h2>
        <p>Total Spent: ${profile.usage.totalSpentUSD.toFixed(2)}</p>
        <p>Chat Minutes Used: {profile.usage.totalChatMinutesUsed}</p>
        <p>Images Generated: {profile.usage.totalImagesGenerated}</p>
        <p>Tips Given: {profile.usage.totalTipsGiven}</p>
      </div>

      <div className="subscription-section">
        <h2>Subscription</h2>
        {profile.subscription.hasActiveSubscription ? (
          <div>
            <p>Status: Active</p>
            {profile.subscription.daysUntilExpiry && (
              <p>Expires in {profile.subscription.daysUntilExpiry} days</p>
            )}
          </div>
        ) : (
          <p>No active subscription</p>
        )}
      </div>

      <div className="transactions-section">
        <h2>Recent Transactions</h2>
        {profile.recentTransactions.length > 0 ? (
          <ul>
            {profile.recentTransactions.map((tx) => (
              <li key={tx.id}>
                <div>
                  <strong>{tx.planName || tx.type}</strong>
                  <span>${tx.amountUSD.toFixed(2)}</span>
                </div>
                <div>
                  <small>{new Date(tx.createdAt).toLocaleDateString()}</small>
                  <span className={`status ${tx.status}`}>{tx.status}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent transactions</p>
        )}
      </div>

      <button onClick={refetch}>Refresh Profile</button>
    </div>
  );
};

export default UserDashboard;
```

### Vue.js Integration Example

```typescript
// composables/useUserProfile.ts
import { ref, onMounted } from 'vue';
import { getUserProfile } from '@/services/api';

export function useUserProfile() {
  const profile = ref<UserProfile | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchProfile = async () => {
    try {
      loading.value = true;
      error.value = null;
      profile.value = await getUserProfile();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load profile';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchProfile();
  });

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}
```

## Additional Endpoints

### GET /users/profile
**Description:** Get basic user information without wallet/payment data

**Response:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "bio": "User bio",
    "avatar": "avatar_url"
  },
  "status": "active",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-15T14:30:00.000Z"
}
```

## Key Features

### 🎯 **Comprehensive Data**
- Complete user profile with balance, usage, and transaction history
- Real-time wallet balance (chat minutes, image credits, tip credits)
- Subscription status and expiration tracking
- Recent transaction history with detailed information

### 🔒 **Security**
- JWT authentication required
- Proper error handling for unauthorized access
- User-specific data isolation

### 📊 **Rich Analytics**
- Usage statistics and spending patterns
- Favorite payment method tracking
- Member since information
- Transaction count and history

### 🏗️ **Architecture Benefits**
- Proper separation of concerns (Users module vs Payments module)
- Clean API design following REST principles
- Comprehensive TypeScript support
- Easy frontend integration

## Usage Tips

1. **Caching:** Consider implementing client-side caching for profile data
2. **Real-time Updates:** Refresh profile after successful payments or credit usage
3. **Error Handling:** Always handle 401 errors by redirecting to login
4. **Loading States:** Show loading indicators while fetching profile data
5. **Offline Support:** Cache profile data for offline viewing

## Testing the Endpoint

### Using cURL
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using Postman
1. Set method to GET
2. URL: `http://localhost:3000/users/me`
3. Add Authorization header: `Bearer YOUR_JWT_TOKEN`
4. Send request

The endpoint is now properly structured in the Users module and ready for frontend integration! 🚀
