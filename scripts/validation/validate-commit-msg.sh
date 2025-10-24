#!/bin/bash

# Commit Message Validation Script
# Prevents common commit message issues including unclosed quotes

commit_msg_file="$1"
commit_msg=$(cat "$commit_msg_file")

# Remove comments and empty lines for validation
clean_msg=$(echo "$commit_msg" | grep -v '^#' | grep -v '^$')

# Check if message is empty
if [ -z "$clean_msg" ]; then
    echo "❌ Error: Commit message cannot be empty"
    exit 1
fi

# Check for unclosed quotes
quote_count_double=$(echo "$clean_msg" | grep -o '"' | wc -l)
quote_count_single=$(echo "$clean_msg" | grep -o "'" | wc -l)

# Check for unbalanced quotes (odd number means unclosed)
if [ $((quote_count_double % 2)) -ne 0 ]; then
    echo "❌ Error: Unclosed double quotes in commit message"
    echo "Message: $clean_msg"
    exit 1
fi

if [ $((quote_count_single % 2)) -ne 0 ]; then
    echo "❌ Error: Unclosed single quotes in commit message"
    echo "Message: $clean_msg"
    exit 1
fi

# Check for basic format (optional - can be customized)
if echo "$clean_msg" | head -1 | grep -qE '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert|merge|hotfix|release|wip)(\(.+\))?: .+'; then
    echo "✅ Commit message format validated"
elif echo "$clean_msg" | head -1 | grep -qE '^(✨|🐛|📚|🎨|♻️|⚡|✅|🔧|🚀|🔒|💫|🔀|🏷️|💥|📝|🚚|➕|➖|⬆️|⬇️|📌|👷|📈|♿|🔊|🔇|👥|🚸|🏗️|📱|🤡|🥚|🙈|📸|⚗️|🔍|🏷️|💡|🍻|💬|🗃️|🔒|🔐): .+'; then
    echo "✅ Commit message format validated (emoji style)"
else
    echo "⚠️  Warning: Consider using conventional commit format"
    echo "Examples:"
    echo "  feat: add new feature"
    echo "  fix: resolve login issue"
    echo "  ✨ feat: add new feature"
    echo "  🐛 fix: resolve login issue"
fi

echo "✅ Commit message validation passed"
exit 0 