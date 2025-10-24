
#!/bin/bash

# Check bundle size and potential secrets leakage
# Created during code polish sprint May 2025

echo "🔍 Checking production bundle..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist/ directory not found. Run npm run build first."
  exit 1
fi

# Get total bundle size in KB
BUNDLE_SIZE=$(du -sk dist | cut -f1)
echo "📊 Bundle size: $BUNDLE_SIZE KB"

# Set maximum allowed bundle size (400KB)
MAX_SIZE=400

if [ "$BUNDLE_SIZE" -gt "$MAX_SIZE" ]; then
  echo "❌ Bundle is too large: $BUNDLE_SIZE KB (max: $MAX_SIZE KB)"
  echo "   Consider code splitting or removing unused dependencies."
  exit 1
else
  echo "✅ Bundle size is acceptable ($BUNDLE_SIZE KB)"
fi

# Check for potential secrets in the bundle
echo "🔒 Checking for potential secrets in bundle..."

# Define patterns to check for
SECRET_PATTERNS=(
  'API_KEY\s*[:=]\s*['\'"][A-Za-z0-9_\-]{20,}['\'"]'
  'api[Kk]ey\s*[:=]\s*['\'"][A-Za-z0-9_\-]{20,}['\'"]'
  'SECRET\s*[:=]\s*['\'"][A-Za-z0-9_\-]{20,}['\'"]'
  'secret\s*[:=]\s*['\'"][A-Za-z0-9_\-]{20,}['\'"]'
  'PASSWORD\s*[:=]\s*['\'"][A-Za-z0-9_\-]{8,}['\'"]'
  'password\s*[:=]\s*['\'"][A-Za-z0-9_\-]{8,}['\'"]'
)

# Add exceptions for known public keys
EXCEPTIONS=(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZmpweXhla3l5cW1zb2Jxc3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTAwNTUsImV4cCI6MjA2MTYyNjA1NX0.MmW8m3VdpEM0npXNZjzOCb22xn7uWrf_bjx-B0N_s9U'
)

FOUND_SECRETS=0

# Check each JS and CSS file in dist
for file in $(find dist -type f -name "*.js" -or -name "*.css"); do
  for pattern in "${SECRET_PATTERNS[@]}"; do
    # Get matches for the pattern
    MATCHES=$(grep -o -E "$pattern" "$file" | sed -E 's/.*[:'\''"=]+([A-Za-z0-9_\-]{8,})['\''"].*/\1/')
    
    # Check each match against exceptions
    if [ -n "$MATCHES" ]; then
      for match in $MATCHES; do
        IS_EXCEPTION=0
        for exception in "${EXCEPTIONS[@]}"; do
          if [ "$match" == "$exception" ]; then
            IS_EXCEPTION=1
            break
          fi
        done
        
        # Only count as a secret if not in exceptions
        if [ "$IS_EXCEPTION" -eq 0 ]; then
          echo "❌ Potential secret found in $file: $pattern"
          FOUND_SECRETS=$((FOUND_SECRETS+1))
        else
          echo "✅ Known public key found in $file (allowlisted)"
        fi
      done
    fi
  done
done

if [ "$FOUND_SECRETS" -gt 0 ]; then
  echo "❌ Error: $FOUND_SECRETS potential secrets found in bundle"
  echo "   Review code to ensure no sensitive data is included"
  exit 1
else
  echo "✅ No potential secrets found in bundle"
fi

echo "✅ Bundle checks passed!"
exit 0
