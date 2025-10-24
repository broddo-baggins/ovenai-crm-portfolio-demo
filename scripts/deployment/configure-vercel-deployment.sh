#!/bin/bash

# Vercel Deployment Configuration Script
# This script configures Vercel to only deploy from main branch

echo "🔧 Configuring Vercel deployment settings..."

# Ensure we're logged in to Vercel
echo "📋 Verifying Vercel authentication..."
npx vercel whoami

if [ $? -ne 0 ]; then
    echo "❌ Please login to Vercel first: npx vercel login"
    exit 1
fi

# Link the project if not already linked
echo "🔗 Ensuring project is linked..."
npx vercel link --yes

echo "✅ Vercel configuration complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Navigate to your project: oven-ai"
echo "3. Go to Settings > Git Integration"
echo "4. Disable 'Automatic Deployments from Git'"
echo "5. Or set Production Branch to 'main' only"
echo ""
echo "🚀 To manually deploy main branch:"
echo "   npx vercel --prod" 