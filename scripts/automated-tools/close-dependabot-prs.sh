#!/bin/bash

# Script to close existing dependabot PRs
# This helps stop the CI/CD spam until we resolve the configuration

echo "🤖 Closing existing dependabot PRs to stop CI/CD spam..."

# Note: This requires GitHub CLI (gh) to be installed and authenticated
# Install with: brew install gh (macOS) or visit https://cli.github.com/

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   macOS: brew install gh"
    echo "   Linux: https://cli.github.com/"
    echo "   Windows: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run: gh auth login"
    exit 1
fi

echo "📋 Fetching dependabot PRs..."

# Get all open PRs from dependabot
DEPENDABOT_PRS=$(gh pr list --state open --author "dependabot[bot]" --json number,title --jq '.[] | "\(.number) \(.title)"')

if [ -z "$DEPENDABOT_PRS" ]; then
    echo "✅ No open dependabot PRs found"
    exit 0
fi

echo "Found the following dependabot PRs:"
echo "$DEPENDABOT_PRS"
echo ""

# Ask for confirmation
read -p "Do you want to close all these PRs? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled by user"
    exit 0
fi

# Close each PR
echo "$DEPENDABOT_PRS" | while read -r pr_line; do
    if [ -n "$pr_line" ]; then
        pr_number=$(echo "$pr_line" | cut -d' ' -f1)
        pr_title=$(echo "$pr_line" | cut -d' ' -f2-)
        
        echo "🔒 Closing PR #$pr_number: $pr_title"
        
        gh pr close "$pr_number" --comment "Closing this dependabot PR temporarily to resolve CI/CD configuration issues. Will re-enable dependabot updates once the configuration is stabilized."
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully closed PR #$pr_number"
        else
            echo "❌ Failed to close PR #$pr_number"
        fi
    fi
done

echo "🏆 Dependabot PR cleanup completed!"
echo ""
echo "Next steps:"
echo "1. The updated dependabot.yml will prevent new PRs"
echo "2. The GitHub Actions workflow is now fork-safe"
echo "3. The test client_id issue has been fixed"
echo "4. You can re-enable dependabot updates by modifying .github/dependabot.yml" 