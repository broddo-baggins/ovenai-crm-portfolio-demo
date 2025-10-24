#!/bin/bash

# 🧹 GitHub PR Cleanup Script
# This script helps you manage pending Dependabot PRs

echo "🧹 GitHub PR Cleanup Tool"
echo "=========================="

# Check if we have GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Let's install it:"
    echo ""
    echo "On macOS: brew install gh"
    echo "Then run: gh auth login"
    echo ""
    echo "Alternative: Go to GitHub.com and manage PRs manually"
    exit 1
fi

echo "📋 Checking current PRs..."

# List open PRs
echo ""
echo "🔍 Current Open PRs:"
gh pr list --state=open

echo ""
echo "🎯 What would you like to do?"
echo ""
echo "1. 🚀 Auto-merge all Dependabot PRs (if they pass checks)"
echo "2. ❌ Close all Dependabot PRs without merging"
echo "3. 📊 Just show me the PR details"
echo "4. 🛑 Exit without changes"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo "🚀 Auto-merging Dependabot PRs..."
        gh pr list --author="app/dependabot" --state=open --json number,title --jq '.[] | "\(.number) \(.title)"' | while read pr; do
            pr_number=$(echo $pr | cut -d' ' -f1)
            echo "Merging PR #$pr_number..."
            gh pr merge $pr_number --auto --squash || echo "❌ Failed to merge PR #$pr_number"
        done
        ;;
    2)
        echo "❌ Closing Dependabot PRs..."
        gh pr list --author="app/dependabot" --state=open --json number,title --jq '.[] | "\(.number) \(.title)"' | while read pr; do
            pr_number=$(echo $pr | cut -d' ' -f1)
            echo "Closing PR #$pr_number..."
            gh pr close $pr_number || echo "❌ Failed to close PR #$pr_number"
        done
        ;;
    3)
        echo "📊 PR Details:"
        gh pr list --state=open
        ;;
    4)
        echo "🛑 Exiting without changes"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Done! Current PR status:"
gh pr list --state=open 