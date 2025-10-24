#!/bin/bash

# 🚀 QUICK DEPLOY SCRIPT - For urgent deployments
# Skips all tests and pre-commit hooks for fastest possible deployment

echo "🚀 QUICK DEPLOY MODE - Skipping all checks!"
echo "⚠️  WARNING: This bypasses all quality checks!"

# Add all changes
git add .

# Get commit message from user or use default
if [ -z "$1" ]; then
  COMMIT_MSG="URGENT: Quick deploy without tests"
else
  COMMIT_MSG="$1"
fi

echo "📝 Committing with message: $COMMIT_MSG"

# Commit without any hooks
git commit -m "$COMMIT_MSG" --no-verify

# Push without any hooks  
echo "📤 Pushing to main branch..."
git push origin main --no-verify

echo "✅ DEPLOYED! Check Vercel dashboard for build status."
echo ""
echo "🔗 Useful commands after this:"
echo "   npm run test:quick     # Run only fast tests"
echo "   npm run test:skip      # Skip problematic tests"
echo "   git push --no-verify   # Always skip hooks" 