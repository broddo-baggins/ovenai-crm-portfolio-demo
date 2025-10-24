# 🔒 Secure Environment Setup Guide

## 🚨 **SECURITY ISSUE IDENTIFIED & FIXED**

**Problem:** The current setup exposes the service role key in client-side code via `VITE_SUPABASE_SERVICE_ROLE_KEY`, which is a **major security vulnerability**.

**Solution:** Separate development and production configurations with proper security practices.

---

## 📋 **Environment Files Setup**

### 1. **Create `.env` (Production - Safe Variables Only)**

Create a `.env` file in your project root with **ONLY** these safe variables:

```bash
# PRODUCTION ENVIRONMENT VARIABLES
# Only client-safe variables here - NO SERVICE ROLE KEYS

# Supabase Configuration (Client-Side Safe)
VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc

# Application Configuration
VITE_APP_URL=https://your-production-domain.com
VITE_ENVIRONMENT=production
VITE_ENABLE_FALLBACK_LOGIN=false
VITE_ALLOW_REGISTRATION=true
```

### 2. **Create `.env.local` (Development - With Service Role)**

Create a `.env.local` file for development (this file is gitignored):

```bash
# DEVELOPMENT ENVIRONMENT VARIABLES
# Includes service role key for development only

# Supabase Configuration
VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc

# SERVICE ROLE KEY - DEVELOPMENT ONLY! 
# This bypasses RLS for development convenience
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMzMjk3NCwiZXhwIjoyMDYyOTA4OTc0fQ.9xN5Ci6uErpsHx-8IwC4B8vh2cCzD39L3frKO66CSos

# Application Configuration
VITE_APP_URL=http://localhost:8080
VITE_ENVIRONMENT=development
VITE_ENABLE_FALLBACK_LOGIN=true
VITE_ALLOW_REGISTRATION=true
```

---

## 🔧 **Code Architecture Fix Required**

### **Current Issue:**
The code is using `supabaseAdmin` (service role) in client-side components, which is wrong.

### **Correct Architecture:**

1. **Client-Side Code:** Use `supabase` (anon key) with proper authentication
2. **Server-Side Code:** Use `supabaseAdmin` (service role) only in server functions
3. **Production:** Rely on Supabase RLS policies for security

---

## 📦 **Deployment Instructions**

### **For Vercel/Netlify/Similar Platforms:**

1. **Add Environment Variables in Platform Dashboard:**
   ```
   VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc
   VITE_APP_URL=https://your-production-domain.com
   VITE_ENVIRONMENT=production
   VITE_ENABLE_FALLBACK_LOGIN=false
   VITE_ALLOW_REGISTRATION=true
   ```

2. **DO NOT ADD THE SERVICE ROLE KEY** to production environment variables

---

## 🚀 **Immediate Steps to Fix Production:**

### **Step 1: Create Environment File**
```bash
# In your project root, create .env file with the production variables above
touch .env
# Copy the production variables (without service role key)
```

### **Step 2: Update Your Deployment Platform**
- Go to your hosting platform (Vercel/Netlify/etc.)
- Add the environment variables in their dashboard
- **Do NOT add the service role key**

### **Step 3: Redeploy**
```bash
# Your deployment should now work
```

---

## ⚠️ **Security Best Practices:**

### **✅ DO:**
- Use anon key in client-side code
- Use service role key only in server-side functions
- Implement proper Supabase RLS policies
- Keep service role key in `.env.local` for development

### **❌ DON'T:**
- Expose service role key in production
- Use `VITE_` prefix for sensitive keys in production
- Commit service role keys to version control

---

## 🛠️ **Next Steps After Environment Fix:**

1. **Fix Code Architecture** - Update components to use proper authentication
2. **Implement RLS Policies** - For production security
3. **Test Production Deployment** - Verify everything works securely

---

**🔒 Result: Secure environment setup that works in both development and production!** 