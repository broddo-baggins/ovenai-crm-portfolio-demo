# 🔧 Environment Setup Guide

## 📋 **Overview**
This guide explains how to properly configure environment variables for OvenAI without hardcoding secrets in your code.

## 🔐 **Security First Approach**
- ✅ **DO**: Use environment variables for all secrets
- ❌ **DON'T**: Hardcode API keys, tokens, or passwords in code
- ✅ **DO**: Keep `.env` files local (they're in `.gitignore`)
- ❌ **DON'T**: Commit `.env` files to git

## 📁 **Environment Files Structure**

### **Required Files (Create Locally):**
```
.env              # Main environment variables
.env.local        # Local development overrides  
.env.production   # Production environment settings
```

### **Example Files (Committed as Templates):**
```
example.env.whatsapp  # WhatsApp configuration template
```

## 🚀 **Quick Setup**

### **1. Copy Your Existing Configuration**
Your environment files are already set up! Check what you have:

```bash
ls -la .env*
```

### **2. Verify Your .env File Contains:**
```env
# OvenAI Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development
NODE_ENV=development
VITE_DEV_MODE=true
```

### **3. For Testing (Optional):**
```env
# Test Configuration (for local development only)
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=your-test-password
```

## 🔌 **How Applications Use Environment Variables**

### **Frontend (Vite) - Prefix with `VITE_`:**
```typescript
// ✅ Correct - Uses environment variable
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ❌ Wrong - Hardcoded secret
const supabase = createClient(
  'https://abc123.supabase.co',
  'eyJhbGciOiJIUzI1NiIs...' // DON'T DO THIS!
);
```

### **Backend/Node.js - Use `process.env`:**
```typescript
// ✅ Correct - Uses environment variable
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ❌ Wrong - Hardcoded secret  
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIs...'; // DON'T DO THIS!
```

### **Tests - Environment Variables with Fallbacks:**
```typescript
// ✅ Correct - Uses env vars with fallback for tests
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'your-test-email@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'your-test-password';
```

## 🧪 **Testing Configuration**

### **Tests Will Work If:**
- ✅ Your `.env` file contains Supabase credentials
- ✅ Test user `test@test.test` exists in your Supabase Auth
- ✅ Backend server is running (if needed)

### **Test Environment Variables:**
```bash
# Optional - Add to .env for custom test credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

## 🔍 **Verify Your Setup**

### **Check Environment Loading:**
```bash
# Start the development server
npm run dev

# In another terminal, check if variables are loaded
echo $VITE_SUPABASE_URL
```

### **Test Database Connection:**
```bash
# Run a simple test to verify connection
npm run test:connection  # (if available)
```

## 🚨 **Security Checklist**

### **✅ Verify These Are In `.gitignore`:**
- `.env`
- `.env.local`
- `.env.production`
- `*.env`
- `**/secrets*`
- `**/credentials*`

### **✅ No Hardcoded Secrets In Code:**
- Search for: `eyJ` (JWT tokens)
- Search for: `sk_` (API keys)
- Search for: `password.*=.*"` (hardcoded passwords)

### **✅ Environment Variable Patterns:**
- Frontend: `VITE_*` prefix for public variables
- Backend: `process.env.*` for server-side secrets
- Never commit service role keys or private keys

## 🌍 **Production Deployment**

### **Vercel/Netlify:**
```bash
# Set environment variables in your deployment platform
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### **Docker:**
```dockerfile
# Use environment variables in Docker
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

## 🆘 **Troubleshooting**

### **Problem: "Cannot connect to Supabase"**
```bash
# Check if environment variables are loaded
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify .env file exists and has correct format
cat .env
```

### **Problem: "Tests failing with auth errors"**  
```bash
# Ensure test user exists and .env has credentials
# Check if your test user exists in Supabase Auth dashboard
```

### **Problem: "Environment variables undefined"**
```bash
# For Vite frontend, ensure variables start with VITE_
# For Node.js backend, use process.env directly
```

## 📚 **Additional Resources**

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Environment Setup](https://supabase.com/docs/guides/local-development)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)

## ✅ **Summary**

Your environment is properly configured with:
- 🔐 Secrets in local `.env` files (not committed)
- 🔄 Application code using environment variables  
- 🧪 Tests using environment-based authentication
- 🛡️ Security patterns preventing secret commits

**Your applications and tests should work correctly with this secure setup!** 