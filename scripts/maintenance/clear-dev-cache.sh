#!/bin/bash

# Clear Development Environment Cache Script
# This script clears various caches that might be causing stale error reports

echo "🧹 Clearing Development Environment Caches..."
echo "============================================="

# Clear npm cache
echo "🔧 Clearing npm cache..."
npm cache clean --force

# Clear TypeScript cache
echo "📝 Clearing TypeScript cache..."
if [ -d ".tsbuildinfo" ]; then
    rm -rf .tsbuildinfo
    echo "   ✅ Removed .tsbuildinfo"
fi

if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f tsconfig.tsbuildinfo
    echo "   ✅ Removed tsconfig.tsbuildinfo"
fi

# Clear Vite cache
echo "⚡ Clearing Vite cache..."
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "   ✅ Removed node_modules/.vite"
fi

# Clear ESLint cache
echo "🔍 Clearing ESLint cache..."
if [ -f ".eslintcache" ]; then
    rm -f .eslintcache
    echo "   ✅ Removed .eslintcache"
fi

# Clear test coverage cache
echo "🧪 Clearing test coverage cache..."
if [ -d "coverage" ]; then
    rm -rf coverage
    echo "   ✅ Removed coverage directory"
fi

# Clear dist directory
echo "📦 Clearing build artifacts..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✅ Removed dist directory"
fi

# Clear playwright cache and test results
echo "🎭 Clearing Playwright artifacts..."
if [ -d "test-results" ]; then
    rm -rf test-results
    echo "   ✅ Removed test-results"
fi

if [ -d "playwright-report" ]; then
    rm -rf playwright-report
    echo "   ✅ Removed playwright-report"
fi

# Clear any temporary files
echo "🗑️  Clearing temporary files..."
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null

echo ""
echo "✅ Cache clearing completed!"
echo ""
echo "💡 Recommended next steps:"
echo "   1. Restart your IDE/editor"
echo "   2. Run: npm install"
echo "   3. Run: npm run build"
echo "   4. Check for any remaining errors"
echo "" 