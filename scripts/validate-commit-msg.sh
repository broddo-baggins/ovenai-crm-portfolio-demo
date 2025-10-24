#!/bin/bash

# Simple commit message validation script
# Prevents problematic commit messages that could cause git issues

commit_msg_file="$1"
commit_msg=$(cat "$commit_msg_file")

# Check for empty commit messages
if [ -z "$commit_msg" ]; then
  echo "❌ Empty commit message not allowed"
  exit 1
fi

# Check for problematic characters that cause git quote issues
if echo "$commit_msg" | grep -q '[""''`]'; then
  echo "❌ Commit message contains problematic quote characters"
  echo "Please use simple ASCII quotes only to avoid git issues"
  echo "Current message: $commit_msg"
  exit 1
fi

# Check for commit message length - HARD LIMIT
first_line=$(echo "$commit_msg" | head -n 1)
if [ ${#first_line} -gt 72 ]; then
  echo "❌ Commit message first line is too long (${#first_line} characters)"
  echo "First line must be 72 characters or less for proper git formatting"
  echo "Current first line: $first_line"
  exit 1
fi

# Check total message length
if [ ${#commit_msg} -gt 200 ]; then
  echo "❌ Total commit message is too long (${#commit_msg} characters)"
  echo "Please keep total message under 200 characters"
  exit 1
fi

echo "✅ Commit message validation passed"
exit 0 