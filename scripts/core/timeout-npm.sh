#!/bin/bash

# Timeout wrapper for NPM commands
# Usage: ./scripts/timeout-npm.sh <timeout_seconds> <npm_command>
# Example: ./scripts/timeout-npm.sh 60 "npm run test"

TIMEOUT=${1:-60}  # Default 60 seconds
shift
COMMAND="$@"

echo "🕐 Running command with ${TIMEOUT}s timeout: $COMMAND"
echo "⏰ Started at: $(date)"

# Run command with timeout
timeout ${TIMEOUT}s bash -c "$COMMAND"
EXIT_CODE=$?

echo "⏰ Finished at: $(date)"

case $EXIT_CODE in
    0)
        echo "✅ Command completed successfully"
        ;;
    124)
        echo "⏰ Command timed out after ${TIMEOUT} seconds"
        echo "💡 Consider increasing timeout or checking for infinite loops"
        ;;
    *)
        echo "❌ Command failed with exit code: $EXIT_CODE"
        ;;
esac

exit $EXIT_CODE 