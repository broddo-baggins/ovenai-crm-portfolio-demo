# 🚀 System Setup Notes

**Important configuration notes for the OvenAI development environment**

## 🔑 Environment Variables (.env.local)

The following environment variables need to be added to `.env.local` for full functionality:

### Missing Supabase Service Role Key
Copy these from `@/credentials/supabase-credentials.local` to `.env.local`:

```bash
# Supabase Service Role Key (needed for edge functions)
SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMzMjk3NCwiZXhwIjoyMDYyOTA4OTc0fQ.9xN5Ci6uErpsHx-8IwC4B8vh2cCzD39L3frKO66CSos
```

## 📱 WhatsApp Credentials (PRODUCTION READY!)

**✅ All WhatsApp credentials are now configured and ready for Meta app review!**

### 🎯 Quick Setup Instructions:

1. **Credentials are already configured** in `@/credentials/whatsapp-credentials.local`
2. **Copy to .env.local** (if edge functions need them):

```bash
# 🔑 WhatsApp Business API Credentials (Production Ready)
# Source: @/credentials/whatsapp-credentials.local
WHATSAPP_ACCESS_TOKEN=EAAOjW2EOihoBOzXM16M...
WHATSAPP_PHONE_NUMBER_ID=516328811554542
WHATSAPP_BUSINESS_ACCOUNT_ID=509878158869000
WHATSAPP_APP_ID=1024037795826202
WHATSAPP_APP_SECRET=1396ce91ab74bb65d92e5d678ca32427
WHATSAPP_CLIENT_TOKEN=76c385a83d453a1e1b5bb436e90f0338
WHATSAPP_BUSINESS_VERIFICATION_ID=932479825407655
WHATSAPP_WEBHOOK_SECRET=jbvnycbNA8od+heP
WHATSAPP_WEBHOOK_URL=https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/from_whatsapp_webhook
```

### 🔄 To Update WhatsApp Credentials:

1. **Edit**: `@/credentials/whatsapp-credentials.local`
2. **Update**: The specific credential values
3. **Copy**: Updated values to `.env.local` if needed
4. **Restart**: Development server and edge functions

### 🎯 App Review Status:
- ✅ **Access Token**: Configured
- ✅ **Phone Number**: Verified business number  
- ✅ **Templates**: Approved and ready
- ✅ **Webhook**: Properly configured endpoint
- ✅ **"Take Lead" Feature**: Fully functional

## 🧪 Test Environment Setup

### Test User Credentials
Source: `@/credentials/test-credentials.local`
```bash
# Test user for E2E testing
TEST_USER_EMAIL=your_test_email@domain.com
TEST_USER_PASSWORD=your_test_password
```

### Database Connections
Source: `@/credentials/test-credentials.local` and `@/credentials/supabase-credentials.local`
```bash
# Site DB (Production UI)
VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc

# Agent DB (Backend automation) - syncs to Site DB
AGENT_DB_URL=https://imnyrhjdoaccxenxyfam.supabase.co
AGENT_DB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbnlyaGpkb2FjY3hlbnh5ZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Mzg0NTAsImV4cCI6MjA2MjMxNDQ1MH0._OfgQMiBmPUdpGa1T6-OJOe-LcDUM56DJZA4GEJgtM8
```

## 🚀 Quick Start Commands

### Start Development Environment
```bash
npm run dev        # Start main app (dynamic port)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Run Tests with Dynamic Ports
```bash
# E2E Tests (uses dynamic port detection)
npx playwright test --config=quality-validation/configs/playwright.config.ts

# WhatsApp Tests
npx playwright test quality-validation/tests/e2e/whatsapp-take-lead.spec.ts

# Mobile Tests
npx playwright test --config=quality-validation/configs/playwright.mobile.config.ts

# Admin Tests  
npx playwright test --config=quality-validation/configs/playwright.config.admin.ts
```

## 📁 Test Results Storage

All test results are automatically stored in:
- **Results**: `quality-validation/results/test-results/`
- **Screenshots**: `quality-validation/results/screenshots/`
- **Logs**: `quality-validation/results/logs/`
- **Reports**: `quality-validation/reports/`

## 🎯 Meta App Review Demo

The system is fully configured for Meta WhatsApp Business app review:

1. **"Take Lead" Button**: ✅ Working in leads list
2. **Template Manager**: ✅ Complete template management UI
3. **Message Sending**: ✅ Real WhatsApp Business API integration
4. **Webhook Handling**: ✅ Properly configured webhook endpoint
5. **E2E Tests**: ✅ Comprehensive test coverage

### Demo Flow:
1. Login with your test credentials (see credentials/test-credentials.local)
2. Navigate to Lead Pipeline
3. Use "Take Lead" button to initiate WhatsApp conversation
4. Select from approved templates
5. Send message via WhatsApp Business API
6. Verify conversation record creation

**🎉 Ready for Meta app review submission!** 

---

## 📋 Credential Files Reference

All credentials are organized in the `@/credentials/` directory:

- **`whatsapp-credentials.local`**: WhatsApp Business API production credentials
- **`supabase-credentials.local`**: Supabase Site DB credentials and service role key
- **`test-credentials.local`**: All testing credentials (users, databases)
- **`agent-db-credentials.local`**: Agent DB specific credentials
- **`db-credentials.local.json`**: JSON format database credentials 