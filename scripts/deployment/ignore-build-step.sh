#!/bin/bash

# Vercel Ignored Build Step Script
# This script tells Vercel when NOT to build/deploy

echo "🔍 Checking if build should proceed..."
echo "Current branch: $VERCEL_GIT_COMMIT_REF"
echo "Current commit: $VERCEL_GIT_COMMIT_SHA"

# Only allow builds from main branch
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
    echo "🚫 Skipping build for branch: $VERCEL_GIT_COMMIT_REF"
    echo "✅ Only main branch deployments are allowed"
    exit 0  # Don't build
else
    echo "✅ Building main branch deployment"
    exit 1  # Proceed with build
fi 