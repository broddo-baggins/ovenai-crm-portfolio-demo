#!/bin/bash

# Git Tags Cleanup Script for OvenAI Repository
# This script helps clean up excessive/outdated git tags

echo "🏷️  Git Tags Cleanup for OvenAI Repository"
echo "============================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📋 Current tags in the repository:"
git tag -l | sort -V

echo ""
echo "📊 Total tags: $(git tag -l | wc -l)"
echo ""

# Define categories of tags to clean up
echo "🧹 Categories of tags identified for cleanup:"
echo ""

echo "1. 📦 Version tags with inconsistent naming:"
echo "   - EA-8.8.8, V2.0.0, V4, V8.1 (inconsistent prefixes)"
echo "   - v1.1.0L (typo with 'L')"
echo ""

echo "2. 🏗️  Development/backup tags:"
echo "   - backup-pre-integration-merge"
echo "   - list (not a real version)"
echo "   - v5.1.0-rebase-env"
echo "   - v9.0.0-stable-working"
echo ""

echo "3. 🔄 Branch-specific tags:"
echo "   - v1.0.0-enterprise-plan"
echo "   - v2.1.0-whatsapp-enhancements"
echo "   - v3.0.0-EA"
echo ""

# Function to delete tags locally and remotely
delete_tags() {
    local tags=("$@")
    
    for tag in "${tags[@]}"; do
        echo "🗑️  Deleting tag: $tag"
        
        # Delete local tag
        git tag -d "$tag" 2>/dev/null && echo "  ✅ Local tag deleted" || echo "  ⚠️  Local tag not found"
        
        # Delete remote tag
        git push origin --delete "$tag" 2>/dev/null && echo "  ✅ Remote tag deleted" || echo "  ⚠️  Remote tag not found"
        
        echo ""
    done
}

# List of tags to keep (only well-formed version tags)
KEEP_TAGS=(
  "v1.0.0"
  "v1.0.4"
  "v2.1.0"
  "v3.0.0"
  "v3.1.0"
  "v3.2.0" 
  "v4.0.1"
  "v5.0.0"
  "v6.0.0"
  "v7.0.0"
  "v8.0.0"
  "v9.0.0-stable-working"
)

# Tags to delete (inconsistent, duplicates, or poorly named)
DELETE_TAGS=(
  "EA-8.8.8"
  "V2.0.0"
  "V4"
  "V8.1"
  "backup-pre-integration-merge"
  "list"
  "v1.0.0-enterprise-plan"
  "v1.0.1"
  "v1.0.2"
  "v1.0.3"
  "v1.1.0L"
  "v2.1.0-whatsapp-enhancements"
  "v3.0.0-EA"
  "v3.0.1"
  "v3.0.5"
  "v3.1.0-enhanced-dashboard"
  "v3.1.1"
  "v3.1.1-fixes"
  "v3.1.2"
  "v3.2.1"
  "v3.2.1-mobile-optimization"
  "v4.2.0"
  "v5.1.0-rebase-env"
  "v6.0.1"
  "v6.2.0"
  "v6.2.1"
  "v7.0"
  "v8.1.0"
  "v8.2.0"
)

echo "🎯 Recommended action:"
echo "Keep: ${#KEEP_TAGS[@]} semantic version tags"
echo "Delete: ${#DELETE_TAGS[@]} problematic/inconsistent tags"
echo ""

# Show what we plan to delete
echo "🗑️  Tags to be deleted:"
for tag in "${DELETE_TAGS[@]}"; do
  if git tag -l "$tag" | grep -q "^$tag$"; then
    echo "  - $tag"
  fi
done

echo ""
echo "✅ Tags to keep:"
for tag in "${KEEP_TAGS[@]}"; do
  if git tag -l "$tag" | grep -q "^$tag$"; then
    echo "  - $tag"
  fi
done

echo ""
read -p "Do you want to proceed with deleting these tags? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "🧹 Deleting tags locally..."
  
  for tag in "${DELETE_TAGS[@]}"; do
    if git tag -l "$tag" | grep -q "^$tag$"; then
      echo "  Deleting local tag: $tag"
      git tag -d "$tag" 2>/dev/null || echo "    Failed to delete $tag locally"
    fi
  done

  echo ""
  echo "🌐 Deleting tags from remote..."
  
  for tag in "${DELETE_TAGS[@]}"; do
    if git ls-remote --tags origin | grep -q "refs/tags/$tag$"; then
      echo "  Deleting remote tag: $tag"
      git push --delete origin "$tag" 2>/dev/null || echo "    Failed to delete $tag from remote"
    fi
  done

  echo ""
  echo "✅ Tag cleanup complete!"
  echo "New tags count: $(git tag | wc -l)"
  echo ""
  echo "Remaining tags:"
  git tag | sort -V
else
  echo "Tag cleanup cancelled."
fi

echo ""
echo "💡 Recommended next steps:"
echo "  1. Create a new release tag: git tag v9.1.0"
echo "  2. Push the new tag: git push origin v9.1.0"
echo "  3. Follow semantic versioning (MAJOR.MINOR.PATCH)"

# Suggest next steps
echo "💡 Next steps:"
echo "1. Consider creating a new release tag for current version"
echo "2. Use semantic versioning going forward (v1.2.3)"
echo "3. Only create tags for actual releases, not for development branches" 