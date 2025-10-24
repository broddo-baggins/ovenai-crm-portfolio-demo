#!/bin/bash

# Unused Variables Cleanup Helper Script
# Usage: ./scripts/cleanup-unused-vars.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Count unused variables
count_unused() {
    npm run lint 2>&1 | grep -c "error.*is defined but never used\|error.*is assigned.*never used" || echo "0"
}

# List affected files
list_files() {
    npm run lint 2>&1 | grep -B1 "error.*is defined but never used\|error.*is assigned.*never used" | grep -E "\.tsx?$" | sort | uniq
}

# Check specific file
check_file() {
    local file="$1"
    if [[ -z "$file" ]]; then
        print_error "Please provide a file path"
        exit 1
    fi
    
    print_header "Checking $file"
    npx eslint "$file" 2>&1 | grep "error.*is defined but never used\|error.*is assigned.*never used" || echo "No unused variables found!"
}

# Fix specific file
fix_file() {
    local file="$1"
    if [[ -z "$file" ]]; then
        print_error "Please provide a file path"
        exit 1
    fi
    
    print_header "Fixing $file"
    
    # Check before
    local before_count=$(npx eslint "$file" 2>&1 | grep -c "error.*is defined but never used\|error.*is assigned.*never used" || echo "0")
    print_warning "Before: $before_count unused variables"
    
    # Auto-fix what we can
    npx eslint "$file" --fix 2>/dev/null || true
    
    # Check after
    local after_count=$(npx eslint "$file" 2>&1 | grep -c "error.*is defined but never used\|error.*is assigned.*never used" || echo "0")
    print_success "After: $after_count unused variables"
    
    if [[ $after_count -lt $before_count ]]; then
        print_success "Reduced unused variables by $((before_count - after_count))"
    fi
    
    if [[ $after_count -gt 0 ]]; then
        print_warning "Remaining issues require manual fixing:"
        npx eslint "$file" 2>&1 | grep "error.*is defined but never used\|error.*is assigned.*never used" || true
    fi
    
    # Run tests
    print_header "Running tests..."
    npm run test:run > /dev/null 2>&1 && print_success "Tests passed" || print_error "Tests failed"
}

# Show progress
show_progress() {
    local total_count=$(count_unused)
    local files_count=$(list_files | wc -l)
    
    print_header "Cleanup Progress"
    echo -e "📊 ${YELLOW}Total unused variables: $total_count${NC}"
    echo -e "📁 ${YELLOW}Files affected: $files_count${NC}"
    
    if [[ $total_count -eq 0 ]]; then
        print_success "🎉 All unused variables cleaned up!"
    else
        echo -e "\n📋 ${BLUE}Next files to fix:${NC}"
        list_files | head -5 | while read -r file; do
            local file_count=$(npx eslint "$file" 2>&1 | grep -c "error.*is defined but never used\|error.*is assigned.*never used" || echo "0")
            echo "  • $file ($file_count errors)"
        done
        
        echo -e "\n💡 ${YELLOW}Quick fix commands:${NC}"
        echo "  ./scripts/cleanup-unused-vars.sh fix-file <filepath>"
        echo "  ./scripts/cleanup-unused-vars.sh auto-fix-batch"
    fi
}

# Auto-fix what we can in batch
auto_fix_batch() {
    print_header "Auto-fixing all files..."
    
    local before_total=$(count_unused)
    print_warning "Before: $before_total total unused variables"
    
    # Run auto-fix on all TypeScript files
    npx eslint . --fix --ext .ts,.tsx 2>/dev/null || true
    
    local after_total=$(count_unused)
    print_success "After: $after_total total unused variables"
    print_success "Auto-fixed: $((before_total - after_total)) variables"
    
    if [[ $after_total -gt 0 ]]; then
        print_warning "$after_total variables require manual fixing"
        echo -e "\n📋 ${BLUE}Files needing manual fixes:${NC}"
        list_files | head -10
    fi
    
    # Run tests
    print_header "Running tests..."
    npm run test:run > /dev/null 2>&1 && print_success "Tests passed" || print_error "Tests failed - check functionality"
}

# Show high priority files
show_priorities() {
    print_header "High Priority Files to Fix"
    
    echo -e "${RED}🔴 Critical UI Components:${NC}"
    echo "  1. src/components/dashboard/WidgetSettings.tsx"
    echo "  2. src/components/leads/LeadsList.tsx"
    echo "  3. src/features/auth/components/LoginForm.tsx"
    echo "  4. src/pages/LandingPage.tsx"
    
    echo -e "\n${YELLOW}🟡 Important Pages:${NC}"
    echo "  5. src/pages/Settings.tsx"
    echo "  6. src/pages/Reports.tsx" 
    echo "  7. src/components/common/RTLProvider.tsx"
    echo "  8. src/pages/Messages.tsx"
    
    echo -e "\n💡 ${BLUE}Suggested workflow:${NC}"
    echo "  ./scripts/cleanup-unused-vars.sh fix-file src/components/dashboard/WidgetSettings.tsx"
    echo "  ./scripts/cleanup-unused-vars.sh fix-file src/components/leads/LeadsList.tsx"
    echo "  ./scripts/cleanup-unused-vars.sh progress"
}

# Update progress in documentation
update_docs() {
    local current_count=$(count_unused)
    local current_date=$(date "+%Y-%m-%d %H:%M")
    
    # Update the main plan document
    if [[ -f "docs/guides/UNUSED_VARIABLES_CLEANUP_PLAN.md" ]]; then
        sed -i.bak "s/Current Progress.*/Current Progress**: $(( (140 - current_count) * 100 / 140 ))% complete ($((140 - current_count))\/140 fixed)/" docs/guides/UNUSED_VARIABLES_CLEANUP_PLAN.md
        sed -i.bak "s/Last Updated.*/Last Updated**: $current_date/" docs/guides/UNUSED_VARIABLES_CLEANUP_PLAN.md
        rm docs/guides/UNUSED_VARIABLES_CLEANUP_PLAN.md.bak 2>/dev/null || true
        print_success "Updated progress documentation"
    fi
}

# Main command dispatcher
case "${1:-help}" in
    "count"|"status")
        count_unused
        ;;
    "list"|"files")
        list_files
        ;;
    "progress"|"p")
        show_progress
        ;;
    "check")
        check_file "$2"
        ;;
    "fix-file"|"fix")
        fix_file "$2"
        update_docs
        ;;
    "auto-fix"|"auto")
        auto_fix_batch
        update_docs
        ;;
    "priorities"|"pri")
        show_priorities
        ;;
    "update-docs")
        update_docs
        ;;
    "help"|*)
        print_header "Unused Variables Cleanup Helper"
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  count           Count total unused variables"
        echo "  list           List all affected files"
        echo "  progress       Show cleanup progress"
        echo "  check <file>   Check specific file for unused variables"
        echo "  fix-file <file> Fix specific file (auto + manual guidance)"
        echo "  auto-fix       Auto-fix all files (what's possible)"
        echo "  priorities     Show high priority files to fix"
        echo "  update-docs    Update progress in documentation"
        echo "  help           Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 progress"
        echo "  $0 fix-file src/components/dashboard/WidgetSettings.tsx"
        echo "  $0 auto-fix"
        echo ""
        ;;
esac 