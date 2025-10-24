#!/bin/bash

# Dependabot Branches Cleanup Script
# This script helps clean up excessive dependabot branches

echo "🤖 Dependabot Branches Cleanup for OvenAI Repository"
echo "==================================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📋 Fetching latest remote information..."
git fetch --all --prune

echo ""
echo "🔍 Finding all dependabot branches..."

# Get all remote dependabot branches
DEPENDABOT_BRANCHES=$(git branch -r | grep 'dependabot' | sed 's/.*origin\///' | sort)

if [ -z "$DEPENDABOT_BRANCHES" ]; then
    echo "✅ No dependabot branches found"
    exit 0
fi

echo "📊 Found $(echo "$DEPENDABOT_BRANCHES" | wc -l) dependabot branches:"
echo ""
echo "$DEPENDABOT_BRANCHES" | while read branch; do
    echo "  🔹 $branch"
done

echo ""

# Function to delete branches
delete_dependabot_branches() {
    echo "🗑️  Starting deletion process..."
    echo ""
    
    # Delete remote branches
    echo "$DEPENDABOT_BRANCHES" | while read branch; do
        if [ -n "$branch" ]; then
            echo "🗑️  Deleting remote branch: origin/$branch"
            git push origin --delete "$branch" 2>/dev/null && echo "  ✅ Remote branch deleted" || echo "  ⚠️  Remote branch not found"
            
            # Also delete local tracking branch if it exists
            git branch -d "$branch" 2>/dev/null && echo "  ✅ Local branch deleted" || echo "  ℹ️  No local branch to delete"
            echo ""
        fi
    done
}

# Show impact summary
echo "🎯 Cleanup Summary:"
echo "Total dependabot branches to delete: $(echo "$DEPENDABOT_BRANCHES" | wc -l)"
echo ""
echo "📂 These branches will be removed:"
echo "• All branches starting with 'dependabot/'"
echo "• This includes npm dependency updates"
echo "• This includes GitHub Actions updates"
echo ""

# Ask for confirmation
read -p "❓ Do you want to proceed with deleting all dependabot branches? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled by user"
    exit 0
fi

# Perform cleanup
delete_dependabot_branches

# Final status
echo "🏆 Dependabot branches cleanup completed!"
echo ""
echo "📊 Final branch summary:"
git branch -r | grep -v dependabot | wc -l | xargs echo "Remaining remote branches:"
echo ""
echo "✅ Repository is now clean of dependabot branches!"

# Suggest next steps
echo ""
echo "💡 Next steps:"
echo "1. The updated dependabot.yml will prevent new branches"
echo "2. Consider running a git garbage collection: git gc --prune=now"
echo "3. Monitor for any new dependabot activity" 