#!/bin/bash

# 🚀 Calendly Environment Setup Script
# This script helps you configure Calendly integration for OvenAI

echo "🚀 Calendly Integration Setup for OvenAI"
echo "========================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Creating from template..."
    
    # Create .env.local from template
    cat > .env.local << 'EOF'
# Calendly OAuth Configuration
VITE_CALENDLY_CLIENT_ID=48XEnOKEGAYNltwhQoO5ihyjUpjznPNm9V9x5p0p3WQ
VITE_CALENDLY_CLIENT_SECRET=26JNT3nCOQReTHhimx0dsq5vSNsTbopBkwY4UmJee2I
VITE_CALENDLY_REDIRECT_URI=http://localhost:3000/auth/calendly/callback

# WhatsApp Configuration (if needed)
VITE_WHATSAPP_ACCESS_TOKEN=
VITE_WHATSAPP_PHONE_NUMBER_ID=
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Development flags
VITE_DEBUG_MODE=true
NODE_ENV=development
EOF
    echo "✅ Created .env.local with Calendly credentials"
else
    echo "✅ .env.local file found"
fi

# Check if Calendly variables are set
echo ""
echo "🔍 Checking Calendly Environment Variables:"

if grep -q "VITE_CALENDLY_CLIENT_ID=" .env.local; then
    CLIENT_ID=$(grep "VITE_CALENDLY_CLIENT_ID=" .env.local | cut -d'=' -f2)
    if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "your_client_id_here" ]; then
        echo "✅ VITE_CALENDLY_CLIENT_ID: Set"
    else
        echo "❌ VITE_CALENDLY_CLIENT_ID: Not configured"
    fi
else
    echo "❌ VITE_CALENDLY_CLIENT_ID: Missing from .env.local"
fi

if grep -q "VITE_CALENDLY_CLIENT_SECRET=" .env.local; then
    CLIENT_SECRET=$(grep "VITE_CALENDLY_CLIENT_SECRET=" .env.local | cut -d'=' -f2)
    if [ -n "$CLIENT_SECRET" ] && [ "$CLIENT_SECRET" != "your_client_secret_here" ]; then
        echo "✅ VITE_CALENDLY_CLIENT_SECRET: Set"
    else
        echo "❌ VITE_CALENDLY_CLIENT_SECRET: Not configured"
    fi
else
    echo "❌ VITE_CALENDLY_CLIENT_SECRET: Missing from .env.local"
fi

# Check redirect URI
if grep -q "VITE_CALENDLY_REDIRECT_URI=" .env.local; then
    echo "✅ VITE_CALENDLY_REDIRECT_URI: Set"
else
    echo "❌ VITE_CALENDLY_REDIRECT_URI: Missing from .env.local"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Run the database migration to fix Messages API:"
echo "   Execute: supabase/sql/fix-messages-api-errors.sql in your Supabase SQL Editor"
echo ""
echo "2. Test the Calendly integration:"
echo "   - Start your dev server: npm run dev"
echo "   - Go to Calendar page: http://localhost:3000/calendar"
echo "   - Click 'Setup Integration' to test OAuth flow"
echo ""
echo "3. Register OAuth redirect URIs in Calendly Developer Portal:"
echo "   - Development: http://localhost:3000/auth/calendly/callback"
echo "   - Production: https://ovenai.app/auth/calendly/callback"
echo ""
echo "4. Test Messages API fixes:"
echo "   - Go to Messages page: http://localhost:3000/messages"
echo "   - Check browser console for any remaining API errors"
echo ""

# Make the script executable
if [ -f "scripts/setup-calendly-environment.sh" ]; then
    chmod +x scripts/setup-calendly-environment.sh
    echo "✅ Script is now executable"
fi

echo "🎉 Setup complete! Your Calendly integration is ready to test." 