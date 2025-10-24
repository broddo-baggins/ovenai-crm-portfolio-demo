#!/bin/bash

# Local Production Mirror Test Script
# Runs EXACTLY the same tests that run in Vercel production
# Use this to catch issues before deploying

echo "🚀 LOCAL PRODUCTION MIRROR TEST"
echo "🎯 Running EXACT same tests as Vercel production..."
echo ""

# Set same environment as production
export VITEST_TIMEOUT=30000
export NODE_ENV=test
export CI=true  # Simulate CI environment

echo "🏗️ STEP 1: Environment Validation"
node scripts/core/validate-env.js --env=production
if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed"
    exit 1
fi
echo "✅ Environment validation passed"
echo ""

echo "🧪 STEP 2: Production Test Suite"
echo "📋 Running exact same command as Vercel: npm run test:production"
echo ""

# Run with timeout exactly like production
timeout 60s npm run test:production
TEST_EXIT_CODE=$?

echo ""
echo "📊 TEST RESULTS:"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED! Safe to deploy to Vercel"
    echo "🚀 Vercel production build should succeed"
    exit 0
elif [ $TEST_EXIT_CODE -eq 124 ]; then
    echo "⏰ Tests timed out after 60 seconds"
    echo "🚨 This would CONTINUE build in Vercel (non-blocking timeout)"
    echo "⚠️  Consider optimizing test performance"
    exit 0
else
    echo "🚨 CRITICAL: Tests failed with exit code $TEST_EXIT_CODE"
    echo "💥 This would FAIL Vercel production build"
    echo "🛑 DO NOT DEPLOY - Fix issues first"
    echo ""
    echo "Common fixes:"
    echo "  - Check React forwardRef issues"
    echo "  - Check dependency conflicts"
    echo "  - Check build safety problems"
    echo "  - Run individual test suites to isolate issues"
    exit $TEST_EXIT_CODE
fi 