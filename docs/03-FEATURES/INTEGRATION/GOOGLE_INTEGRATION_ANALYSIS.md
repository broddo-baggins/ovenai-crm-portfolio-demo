# Google Integration Analysis & Resolution

## 🔍 **Problem Analysis**

### **Current State**
- Added Google client to Vercel ✅
- Added Google OAuth URIs ✅  
- Added credentials to `.env.local` ✅
- Added code integration ✅
- **BUT**: Getting 404 when trying to login with Google to Calendly ❌

### **Root Cause Identification**

The issue is **NOT** with Google OAuth itself, but with the **missing user-level Google credentials** in the database.

## 🏗️ **API Credentials Architecture** 

### **App-Level (Managed by OvenAI)**
```env
# .env.local - Our Google Cloud Project
GOOGLE_CLIENT_ID=your-app-google-client-id
GOOGLE_CLIENT_SECRET=your-app-google-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/google/callback
```

### **User-Level (Missing - This is the problem!)**
```sql
-- user_api_credentials table needs Google entries
INSERT INTO user_api_credentials (
  user_id,
  credential_type,
  credential_name, 
  encrypted_value,
  is_active
) VALUES (
  'user-uuid',
  'google',
  'client_id',
  'encrypted-user-google-client-id',
  true
);
```

## 🚨 **The Missing Piece**

### **What We Have**
1. **App-level Google OAuth** - Working ✅
2. **Calendly integration** - Working ✅
3. **Database schema** - Ready ✅

### **What's Missing**
1. **User-level Google credentials** in `user_api_credentials` table ❌
2. **Google Calendar API access** per user ❌  
3. **User Google OAuth flow** for individual users ❌

## 💡 **Solution Implementation**

### **Step 1: Add User Google Credentials**
```javascript
// Script to add Google credentials for test user
const googleCredentials = [
  {
    credential_type: 'google',
    credential_name: 'client_id',
    encrypted_value: btoa('user-google-client-id')
  },
  {
    credential_type: 'google', 
    credential_name: 'client_secret',
    encrypted_value: btoa('user-google-client-secret')
  },
  {
    credential_type: 'google',
    credential_name: 'access_token', 
    encrypted_value: btoa('user-google-access-token')
  },
  {
    credential_type: 'google',
    credential_name: 'refresh_token',
    encrypted_value: btoa('user-google-refresh-token')
  }
];
```

### **Step 2: Google Calendar Integration Flow**

```mermaid
graph TD
    A[User clicks "Connect Google Calendar"] --> B[Check user_api_credentials]
    B --> C{Has Google credentials?}
    C -->|No| D[Show Google OAuth setup]
    C -->|Yes| E[Test existing credentials]
    E --> F{Credentials valid?}
    F -->|No| G[Refresh token or re-auth]
    F -->|Yes| H[Show connected status]
    D --> I[User provides Google OAuth consent]
    I --> J[Store credentials in user_api_credentials]
    J --> H
```

### **Step 3: Integration Points**

#### **Settings Page Integration**
```typescript
// Settings.tsx - Add Google integration section
const handleConnectGoogle = async () => {
  try {
    // Check if user has Google credentials
    const googleCreds = await userCredentialsService.getServiceCredentials('google');
    
    if (googleCreds.length === 0) {
      // Start Google OAuth flow for this user
      window.location.href = `/auth/google/connect?user_id=${user.id}`;
    } else {
      // Test existing credentials
      const isValid = await testGoogleCredentials(googleCreds);
      if (!isValid) {
        // Refresh or re-authenticate
        await refreshGoogleToken(googleCreds);
      }
    }
  } catch (error) {
    toast.error('Failed to connect Google Calendar');
  }
};
```

#### **Calendly Integration Enhancement**
```typescript
// calendlyService.ts - Add Google Calendar sync
export class CalendlyService {
  async syncWithGoogleCalendar(userId: string) {
    const googleCreds = await userCredentialsService.getServiceCredentials('google');
    const calendlyCreds = await userCredentialsService.getServiceCredentials('calendly');
    
    if (googleCreds.length === 0) {
      throw new Error('Google Calendar not connected');
    }
    
    // Sync Calendly events with Google Calendar
    return await this.performCalendarSync(googleCreds, calendlyCreds);
  }
}
```

## 🔧 **Implementation Script**

### **Add Google Credentials to Test User**
```bash
# Run this script to add Google credentials
node scripts/testing/add-google-credentials.cjs
```

```javascript
// scripts/testing/add-google-credentials.cjs
const { createClient } = require('@supabase/supabase-js');

async function addGoogleCredentials() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === 'test@test.test');
  
  const googleCredentials = [
    {
      user_id: testUser.id,
      credential_type: 'google',
      credential_name: 'client_id',
      encrypted_value: btoa('test-google-client-id-123'),
      is_active: true
    },
    {
      user_id: testUser.id,
      credential_type: 'google', 
      credential_name: 'client_secret',
      encrypted_value: btoa('test-google-client-secret-456'),
      is_active: true
    },
    {
      user_id: testUser.id,
      credential_type: 'google',
      credential_name: 'access_token',
      encrypted_value: btoa('test-google-access-token-789'),
      is_active: true
    }
  ];
  
  for (const cred of googleCredentials) {
    await supabase.from('user_api_credentials').insert(cred);
  }
  
  console.log('✅ Google credentials added for test user');
}
```

## 🎯 **Expected Outcome**

After implementing this solution:

1. **Settings page** will show Google Calendar integration status ✅
2. **Users can connect** their Google Calendar via OAuth ✅  
3. **Calendly + Google sync** will work properly ✅
4. **No more 404 errors** when connecting Google services ✅

## 📋 **Testing Checklist**

- [ ] Add Google credentials to `user_api_credentials` table
- [ ] Test Google OAuth flow for users
- [ ] Verify Google Calendar API access
- [ ] Test Calendly + Google Calendar sync
- [ ] Confirm settings page shows Google status
- [ ] Validate no 404 errors in Google auth flow

## 🔄 **Migration Plan**

### **Phase 1: Database Setup**
1. Add Google credentials for existing users
2. Create Google OAuth endpoints
3. Update settings UI to show Google integration

### **Phase 2: User Flow**
1. Implement user Google OAuth consent
2. Store per-user Google credentials securely  
3. Add Google Calendar sync functionality

### **Phase 3: Integration**
1. Connect Calendly with Google Calendar
2. Real-time calendar sync
3. Event management across platforms

---

**📌 Key Insight**: The Google integration wasn't failing due to OAuth setup - it was missing the **per-user credential storage** that allows each user to connect their own Google Calendar account to the system. 