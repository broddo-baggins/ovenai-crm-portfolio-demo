#!/bin/bash

# Create .env.local file for Google OAuth Integration
# This fixes the Google Calendar 404 issue

echo "🔧 Creating .env.local file for Google OAuth integration..."

cat > .env.local << 'EOF'
# Google OAuth Configuration (Required for Google Calendar Integration)
VITE_GOOGLE_CLIENT_ID=28489724970-02ltjqglipm5j073af110rpjn086drj1.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-client-secret-here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Supabase Configuration
VITE_SUPABASE_URL=https://ajszzemkpenbfnghqiyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc

# Development Settings
VITE_ENVIRONMENT=development
VITE_ENABLE_FALLBACK_LOGIN=true
VITE_ALLOW_REGISTRATION=true

# Calendly Integration
VITE_CALENDLY_CLIENT_ID=48XEnOKEGAYNltwhQoO5ihyjUpjznPNm9V9x5p0p3WQ
VITE_CALENDLY_CLIENT_SECRET=26JNT3nCOQReTHhimx0dsq5vSNsTbopBkwY4UmJee2I
VITE_CALENDLY_REDIRECT_URI=http://localhost:3000/auth/calendly/callback
EOF

echo "✅ Created .env.local file!"
echo ""
echo "📋 IMPORTANT: Update the Google Client Secret"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Find your OAuth credentials"  
echo "3. Copy the actual Client Secret"
echo "4. Replace 'GOCSPX-your-actual-client-secret-here' in .env.local"
echo ""
echo "🚀 After updating the secret, restart your dev server:"
echo "   npm run dev" 