#!/bin/bash

# Emergency script to kill hanging NPM/Node processes
# Usage: ./scripts/kill-hanging.sh [--force]

FORCE_KILL=${1:-""}

echo "🚨 Emergency Process Killer"
echo "🔍 Searching for hanging npm/node/vitest processes..."

# Find all npm/node/vitest processes
PROCESSES=$(ps aux | grep -E "npm|node|vitest" | grep -v grep | grep -v kill-hanging)

if [ -z "$PROCESSES" ]; then
    echo "✅ No hanging processes found"
    exit 0
fi

echo "⚠️  Found the following processes:"
echo "$PROCESSES"
echo ""

if [ "$FORCE_KILL" = "--force" ]; then
    echo "💀 Force killing all processes..."
    echo "$PROCESSES" | awk '{print $2}' | xargs -I {} kill -KILL {} 2>/dev/null
    echo "✅ Force kill completed"
else
    echo "🔪 Gracefully terminating processes..."
    echo "$PROCESSES" | awk '{print $2}' | xargs -I {} kill -TERM {} 2>/dev/null
    
    echo "⏳ Waiting 5 seconds for graceful shutdown..."
    sleep 5
    
    # Check if any processes are still running
    REMAINING=$(ps aux | grep -E "npm|node|vitest" | grep -v grep | grep -v kill-hanging)
    
    if [ ! -z "$REMAINING" ]; then
        echo "⚠️  Some processes are still running. Force killing..."
        echo "$REMAINING" | awk '{print $2}' | xargs -I {} kill -KILL {} 2>/dev/null
        echo "💀 Force kill completed"
    else
        echo "✅ All processes terminated gracefully"
    fi
fi

# Clean up any leftover lock files
echo "🧹 Cleaning up lock files..."
find . -name "*.lock" -type f -delete 2>/dev/null || true
find . -name ".npm" -type d -exec rm -rf {} + 2>/dev/null || true

echo "🎉 Cleanup completed!"
echo ""
echo "💡 To prevent hanging in the future:"
echo "   - Use: npm run test:safe"
echo "   - Use: timeout 60s npm run test"
echo "   - Monitor: ./scripts/monitor-commands.sh &" 