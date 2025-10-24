#!/bin/bash

# 🧪 Local Build Test Script
# Tests the build locally BEFORE pushing to Vercel
# Prevents failed deployments!

echo "🧪 ================================================"
echo "   LOCAL BUILD TEST (Before Pushing to Vercel)"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Run this script from the project root"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
echo "✅ Clean complete"
echo ""

# Run the build
echo "🔧 Running production build..."
echo "   (This is what Vercel will run)"
echo ""

if npm run build; then
    echo ""
    echo "================================================"
    echo "✅ BUILD SUCCESSFUL!"
    echo "================================================"
    echo ""
    echo "📦 Build output:"
    ls -lh dist/ | head -10
    echo ""
    echo "✅ Safe to push to Vercel!"
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m \"Your message\""
    echo "  git push"
    echo ""
    exit 0
else
    echo ""
    echo "================================================"
    echo "❌ BUILD FAILED!"
    echo "================================================"
    echo ""
    echo "⚠️  DO NOT PUSH TO VERCEL!"
    echo ""
    echo "Fix the errors above, then:"
    echo "  ./test-build.sh    # Test again"
    echo ""
    exit 1
fi

