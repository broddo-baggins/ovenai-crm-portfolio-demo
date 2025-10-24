# 🚀 Production Environment Setup Guide

**Last Updated:** January 29, 2025  
**Status:** ✅ **READY FOR PRODUCTION DEPLOYMENT**

---

## 📋 **OVERVIEW**

This guide covers setting up environment variables for production deployment. The Google OAuth Client ID is **safe to be public** and should be included in your production environment.

---

## 🔧 **VERCEL DEPLOYMENT** (Recommended)

### **Step 1: Environment Variables in Vercel Dashboard**

1. **Go to:** [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
2. **Add the following variables:**

```bash
# Google OAuth Configuration (Safe to be public)
VITE_GOOGLE_CLIENT_ID=28489724970-02ltjqglipm5j073af110rpjn086drj1.apps.googleusercontent.com

# Supabase Configuration
VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc

# Application Configuration
VITE_APP_URL=https://www.oveni.app
VITE_ENVIRONMENT=production

# Production Flags
VITE_ENABLE_FALLBACK_LOGIN=false
VITE_ALLOW_REGISTRATION=true

# Calendly OAuth (Production)
VITE_CALENDLY_CLIENT_ID=48XEnOKEGAYNltwhQoO5ihyjUpjznPNm9V9x5p0p3WQ
VITE_CALENDLY_CLIENT_SECRET=26JNT3nCOQReTHhimx0dsq5vSNsTbopBkwY4UmJee2I
VITE_CALENDLY_REDIRECT_URI=https://www.oveni.app/auth/calendly/callback
```

3. **Set Environment:** Production, Preview, Development (all three)
4. **Redeploy** your application

### **Step 2: Google Cloud Console Setup**

Update your Google OAuth configuration for production:

1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **Edit your OAuth 2.0 Client ID**
3. **Add Authorized Redirect URIs:**
   ```
   https://www.oveni.app/auth/google/callback
   https://oveni.app/auth/google/callback
   ```
4. **Add Authorized JavaScript Origins:**
   ```
   https://www.oveni.app
   https://oveni.app
   ```

---

## 🌐 **OTHER PLATFORMS**

### **Netlify**
1. **Go to:** Site Settings → Environment Variables
2. **Add the same variables** as listed above for Vercel
3. **Redeploy**

### **Railway**
1. **Go to:** Project → Variables
2. **Add the environment variables**
3. **Deploy**

### **DigitalOcean App Platform**
1. **Go to:** Settings → Environment
2. **Add variables** with appropriate scopes
3. **Deploy**

---

## 🔐 **SECURITY BEST PRACTICES**

### **✅ SAFE TO COMMIT/EXPOSE:**
- `VITE_GOOGLE_CLIENT_ID` - OAuth client IDs are designed to be public
- `VITE_SUPABASE_URL` - Public Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Anon key (protected by RLS)
- `VITE_APP_URL` - Public application URL
- `VITE_CALENDLY_CLIENT_ID` - OAuth client ID

### **🚫 NEVER COMMIT/EXPOSE:**
- `VITE_GOOGLE_CLIENT_SECRET` - Keep this secret (if used)
- `VITE_CALENDLY_CLIENT_SECRET` - OAuth client secret
- Service role keys
- Database passwords
- Private API keys

---

## 🧪 **VALIDATION**

### **Local Validation Script**
```bash
# Run the validation script
node scripts/validate-google-oauth.cjs
```

### **Production Validation**
1. **Deploy your app** to production
2. **Navigate to:** `https://www.oveni.app/settings`
3. **Click:** "Connect Google Account"
4. **Verify:** OAuth flow redirects to Google correctly
5. **Check:** No client_id errors in browser console

---

## 🛠️ **TROUBLESHOOTING**

### **"client_id parameter missing" Error**
- **Cause:** Environment variable not set in deployment platform
- **Fix:** Add `VITE_GOOGLE_CLIENT_ID` to platform environment variables
- **Verify:** Check deployment logs for environment loading

### **"redirect_uri_mismatch" Error**
- **Cause:** Google Cloud Console not updated with production URLs
- **Fix:** Add production URLs to Google Cloud Console
- **URLs to add:**
  - `https://www.oveni.app/auth/google/callback`
  - `https://oveni.app/auth/google/callback`

### **OAuth consent screen issues**
- **Cause:** Google OAuth verification pending
- **Status:** ✅ **VERIFIED** (Ready for production)
- **Note:** Your OAuth consent screen is approved and production-ready

---

## 📋 **DEPLOYMENT CHECKLIST**

- [ ] ✅ Environment variables added to deployment platform
- [ ] ✅ Google Cloud Console updated with production URLs
- [ ] ✅ OAuth consent screen verified (COMPLETED)
- [ ] ✅ Application deployed and accessible
- [ ] ✅ Google OAuth flow tested in production
- [ ] ✅ No environment variable errors in logs
- [ ] ✅ SSL certificate working (https://)
- [ ] ✅ All integrations functional

---

## 🎯 **QUICK DEPLOYMENT COMMANDS**

### **Vercel**
```bash
# Deploy to Vercel
npm run build
vercel --prod

# Or using Vercel CLI
vercel env add VITE_GOOGLE_CLIENT_ID
vercel env add VITE_SUPABASE_URL
# ... add other variables
vercel --prod
```

### **Netlify**
```bash
# Deploy to Netlify
npm run build
netlify deploy --prod --dir=dist
```

---

## 💡 **DEVELOPMENT vs PRODUCTION**

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_APP_URL` | `http://localhost:3000` | `https://www.oveni.app` |
| `VITE_ENVIRONMENT` | `development` | `production` |
| `VITE_ENABLE_FALLBACK_LOGIN` | `true` | `false` |
| Google Redirect URI | `localhost:3000/auth/...` | `www.oveni.app/auth/...` |
| Calendly Redirect URI | `localhost:3000/auth/...` | `www.oveni.app/auth/...` |

---

## 🚀 **READY FOR PRODUCTION!**

Your Google OAuth Client ID `28489724970-02ltjqglipm5j073af110rpjn086drj1.apps.googleusercontent.com` is:
- ✅ **Verified by Google**
- ✅ **Safe to be public**
- ✅ **Production ready**
- ✅ **Can be committed to version control**

Deploy with confidence! 🎉 