#!/bin/bash

# Command Monitor - Detects and kills hanging NPM processes
# Usage: ./scripts/monitor-commands.sh [max_runtime_minutes]

MAX_RUNTIME=${1:-10}  # Default 10 minutes
SLEEP_INTERVAL=30     # Check every 30 seconds

echo "🔍 Starting command monitor (max runtime: ${MAX_RUNTIME} minutes)"
echo "📊 Checking every ${SLEEP_INTERVAL} seconds for hanging processes"

while true; do
    # Find long-running npm/node processes
    LONG_PROCESSES=$(ps aux | awk -v max_min=$MAX_RUNTIME '
        /npm|node|vitest/ && !/grep/ && !/monitor-commands/ {
            # Calculate runtime in minutes
            split($10, time_parts, ":")
            if (length(time_parts) == 2) {
                runtime_min = time_parts[1] + time_parts[2]/60
            } else if (length(time_parts) == 3) {
                runtime_min = time_parts[1]*60 + time_parts[2] + time_parts[3]/60
            } else {
                runtime_min = 0
            }
            
            if (runtime_min > max_min) {
                print $2, $11, runtime_min "min"
            }
        }
    ')

    if [ ! -z "$LONG_PROCESSES" ]; then
        echo "⚠️  Found long-running processes:"
        echo "$LONG_PROCESSES"
        echo ""
        echo "🔪 Killing hanging processes..."
        
        echo "$LONG_PROCESSES" | while read pid cmd runtime; do
            echo "  Killing PID $pid ($cmd) - Runtime: $runtime"
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
        done
        
        echo "✅ Cleanup completed"
    fi

    sleep $SLEEP_INTERVAL
done 