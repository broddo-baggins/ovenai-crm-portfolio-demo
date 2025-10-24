#!/bin/bash

# Git History Secret Scanner
# Inspired by TruffleHog's Force Push Scanner research
# https://trufflesecurity.com/blog/guest-post-how-i-scanned-all-of-github-s-oops-commits-for-leaked-secrets

echo "🔍 Git History Secret Scanner"
echo "=============================================="
echo "Scanning for potentially leaked secrets in git history..."
echo "Based on TruffleHog 'Oops Commits' research findings"
echo ""

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Secret patterns from the research
declare -a patterns=(
    "VITE_SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_SERVICE_ROLE_KEY" 
    "eyJ[A-Za-z0-9_\/+-]*\.[A-Za-z0-9_\/+-]*\.[A-Za-z0-9_\/+-]*"  # JWT tokens
    "sk_live_[0-9a-zA-Z]{24,}"  # Stripe live keys
    "sk_test_[0-9a-zA-Z]{24,}"  # Stripe test keys
    "AKIA[0-9A-Z]{16}"  # AWS Access Keys
    "ghp_[0-9a-zA-Z]{36}"  # GitHub Personal Access Tokens
    "gho_[0-9a-zA-Z]{36}"  # GitHub OAuth Tokens
    "mongodb://.*:[^@/]*@"  # MongoDB with credentials
    "postgres://.*:[^@/]*@"  # PostgreSQL with credentials
    "mysql://.*:[^@/]*@"  # MySQL with credentials
)

# High-risk files from research (most common leak sources)
declare -a risky_files=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    "index.js"
    "application.properties"
    "app.js"
    "server.js"
    "docker-compose.yml"
    "README.md"
    "main.py"
    "appsettings.json"
    "db.js"
    "settings.py"
    "config.py"
    "app.py"
    "config.env"
    "application.yml"
    "config.json"
    "config.js"
)

total_commits=0
flagged_commits=0
secret_files_found=0

echo "📊 Analyzing git history..."

# Get all commits that modified risky files
for file in "${risky_files[@]}"; do
    if git log --oneline --follow -- "$file" > /dev/null 2>&1; then
        echo -e "${YELLOW}Found history for risky file: $file${NC}"
        ((secret_files_found++))
        
        # Get commits that modified this file
        commits=$(git log --oneline --follow -- "$file" | cut -d' ' -f1)
        
        for commit in $commits; do
            ((total_commits++))
            
            # Check if this commit contains secrets
            for pattern in "${patterns[@]}"; do
                if git show "$commit:$file" 2>/dev/null | grep -qE "$pattern"; then
                    echo -e "${RED}🚨 POTENTIAL SECRET FOUND${NC}"
                    echo "   File: $file"
                    echo "   Commit: $commit"
                    echo "   Pattern: $pattern"
                    echo "   URL: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/commit/$commit"
                    echo ""
                    ((flagged_commits++))
                fi
            done
        done
    fi
done

echo "=============================================="
echo "📈 SCAN RESULTS"
echo "=============================================="
echo "Total commits scanned: $total_commits"
echo "Risky files found in history: $secret_files_found"
echo "Commits with potential secrets: $flagged_commits"

if [ $flagged_commits -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  CRITICAL SECURITY FINDINGS${NC}"
    echo "=============================================="
    echo "Potential secrets found in git history!"
    echo ""
    echo "According to TruffleHog research:"
    echo "• GitHub NEVER deletes commits - even 'deleted' ones remain accessible"
    echo "• Secrets in git history should be considered permanently compromised"
    echo "• Force pushes do NOT remove commits from GitHub's archive"
    echo ""
    echo "🔧 IMMEDIATE ACTIONS REQUIRED:"
    echo "1. Rotate/revoke ALL potentially compromised secrets"
    echo "2. Update applications with new credentials"
    echo "3. Review access logs for unauthorized usage"
    echo "4. Consider using tools like git-filter-branch (but commits remain on GitHub)"
    echo ""
    echo "📚 Learn more:"
    echo "https://trufflesecurity.com/blog/guest-post-how-i-scanned-all-of-github-s-oops-commits-for-leaked-secrets"
else
    echo -e "${GREEN}✅ No obvious secrets found in git history${NC}"
    echo "This doesn't guarantee complete security - manual review recommended"
fi

echo ""
echo "💡 Prevention Tips:"
echo "• Always use .gitignore for sensitive files"
echo "• Use environment variables instead of hardcoded secrets"
echo "• Enable pre-commit hooks to scan for secrets"
echo "• Regularly audit your codebase with tools like TruffleHog"
echo "• Consider using secret management solutions" 