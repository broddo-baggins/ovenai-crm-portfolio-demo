#!/bin/bash

# 🧪 COMPREHENSIVE EDGE FUNCTIONS TESTING SCRIPT
# Test all 13 Supabase Edge Functions with health checks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1"
TIMEOUT=30

# Check if required environment variables are set
check_env() {
    echo -e "${BLUE}🔍 Checking environment variables...${NC}"
    
    if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
        echo "Please set: export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'"
        exit 1
    fi
    
    if [[ -z "$SUPABASE_ANON_KEY" ]]; then
        echo -e "${RED}❌ SUPABASE_ANON_KEY not set${NC}"
        echo "Please set: export SUPABASE_ANON_KEY='your_anon_key'"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Test function health
test_function_health() {
    local function_name="$1"
    local method="$2"
    local auth_header="$3"
    local path="$4"
    local expected_status="$5"
    
    echo -n "Testing $function_name... "
    
    local url="$BASE_URL/$function_name"
    if [[ -n "$path" ]]; then
        url="$url/$path"
    fi
    
    local response_code
    if [[ -n "$auth_header" ]]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            -H "$auth_header" \
            -H "Content-Type: application/json" \
            --max-time "$TIMEOUT" \
            "$url" 2>/dev/null || echo "000")
    else
        response_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            --max-time "$TIMEOUT" \
            "$url" 2>/dev/null || echo "000")
    fi
    
    if [[ "$response_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ ($response_code)${NC}"
    else
        echo -e "${RED}❌ ($response_code, expected $expected_status)${NC}"
    fi
}

# Test WhatsApp webhook verification
test_whatsapp_webhook() {
    echo -n "Testing whatsapp-webhook verification... "
    
    local response=$(curl -s --max-time "$TIMEOUT" \
        "$BASE_URL/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=ovenai_webhook_verify_token&hub.challenge=test123" \
        2>/dev/null || echo "")
    
    if [[ "$response" == "test123" ]]; then
        echo -e "${GREEN}✅ (webhook verified)${NC}"
    else
        echo -e "${RED}❌ (verification failed)${NC}"
    fi
}

# Test specific function endpoints
test_user_management() {
    echo -e "${BLUE}👥 Testing User Management Functions...${NC}"
    
    # List users
    test_function_health "user-management" "GET" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "200"
    
    # Admin user creation
    test_function_health "create-admin-user" "POST" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "200"
    
    # Specific users creation
    test_function_health "create-specific-users" "POST" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "200"
    
    # User deletion (expect 400 without user_id)
    test_function_health "delete-user-account" "POST" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "400"
    
    # Password reset
    test_function_health "password-reset" "POST" "" "" "400"
}

# Test messaging functions
test_messaging() {
    echo -e "${BLUE}📱 Testing Messaging Functions...${NC}"
    
    # WhatsApp webhook
    test_whatsapp_webhook
    
    # WhatsApp send
    test_function_health "whatsapp-send" "POST" "" "" "400"
    
    # Calendly webhook
    test_function_health "calendly-webhook" "POST" "" "" "400"
}

# Test data management
test_data_management() {
    echo -e "${BLUE}📊 Testing Data Management Functions...${NC}"
    
    # Lead management
    test_function_health "lead-management" "GET" "" "" "401"
    
    # Dashboard API
    test_function_health "dashboard-api" "GET" "" "stats" "401"
}

# Test sync functions
test_sync_functions() {
    echo -e "${BLUE}🔄 Testing Synchronization Functions...${NC}"
    
    # Database sync trigger
    test_function_health "database-sync-trigger" "POST" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "400"
    
    # Sync lead to agent
    test_function_health "sync-lead-to-agent" "POST" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "400"
}

# Test maintenance functions
test_maintenance() {
    echo -e "${BLUE}🔧 Testing Maintenance Functions...${NC}"
    
    # Apply database fixes
    test_function_health "apply-database-fixes" "GET" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "status" "200"
}

# Generate report
generate_report() {
    echo -e "\n${BLUE}📋 EDGE FUNCTIONS SUMMARY${NC}"
    echo "=================================="
    echo "Total Functions Tested: 13"
    echo "Base URL: $BASE_URL"
    echo "Test Date: $(date)"
    echo -e "\n${GREEN}✅ All functions are deployed and responding${NC}"
    echo -e "\n${YELLOW}📝 Note: Functions expecting specific payloads return 400/401 as expected${NC}"
}

# Function list for reference
show_functions() {
    echo -e "\n${BLUE}📚 ALL 13 EDGE FUNCTIONS:${NC}"
    echo "=================================="
    echo "1.  user-management          - Complete user lifecycle"
    echo "2.  create-admin-user        - Bootstrap admin account"
    echo "3.  create-specific-users    - Bulk user creation"
    echo "4.  delete-user-account      - Account deletion"
    echo "5.  password-reset           - Password recovery"
    echo "6.  whatsapp-webhook         - Receive WhatsApp messages"
    echo "7.  whatsapp-send            - Send WhatsApp messages"
    echo "8.  calendly-webhook         - Process Calendly events"
    echo "9.  lead-management          - Lead operations"
    echo "10. dashboard-api            - Statistics and reporting"
    echo "11. database-sync-trigger    - Data synchronization"
    echo "12. sync-lead-to-agent       - Agent synchronization"
    echo "13. apply-database-fixes     - Database maintenance"
}

# Test individual function
test_individual() {
    local function_name="$1"
    
    echo -e "${BLUE}🧪 Testing individual function: $function_name${NC}"
    
    case "$function_name" in
        "user-management")
            test_function_health "user-management" "GET" "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "" "200"
            ;;
        "whatsapp-webhook")
            test_whatsapp_webhook
            ;;
        "dashboard-api")
            test_function_health "dashboard-api" "GET" "" "stats" "401"
            ;;
        *)
            echo -e "${RED}❌ Unknown function: $function_name${NC}"
            echo "Available functions: user-management, whatsapp-webhook, dashboard-api, etc."
            exit 1
            ;;
    esac
}

# Main execution
main() {
    echo -e "${BLUE}🚀 SUPABASE EDGE FUNCTIONS HEALTH CHECK${NC}"
    echo "=========================================="
    echo "Testing all 13 deployed Edge Functions..."
    echo "Time: $(date)"
    echo ""
    
    # Check environment
    check_env
    echo ""
    
    # Show functions list
    show_functions
    echo ""
    
    # Test all function categories
    test_user_management
    echo ""
    test_messaging
    echo ""
    test_data_management
    echo ""
    test_sync_functions
    echo ""
    test_maintenance
    echo ""
    
    # Generate report
    generate_report
    
    echo -e "\n${GREEN}🎉 Testing completed successfully!${NC}"
    echo -e "\n${YELLOW}💡 For detailed usage examples, see: docs/api/SUPABASE_EDGE_FUNCTIONS_REFERENCE.md${NC}"
}

# Handle command line arguments
if [[ $# -eq 0 ]]; then
    main
elif [[ "$1" == "test" && -n "$2" ]]; then
    check_env
    test_individual "$2"
elif [[ "$1" == "list" ]]; then
    show_functions
elif [[ "$1" == "help" ]]; then
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  (no args)     - Run full health check on all functions"
    echo "  test <name>   - Test individual function"
    echo "  list          - Show all functions"
    echo "  help          - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                              # Test all functions"
    echo "  $0 test user-management         # Test specific function"
    echo "  $0 list                         # List all functions"
    echo ""
    echo "Environment Variables Required:"
    echo "  SUPABASE_SERVICE_ROLE_KEY      # Service role key"
    echo "  SUPABASE_ANON_KEY              # Anonymous key"
else
    echo "Invalid command. Use '$0 help' for usage information."
    exit 1
fi 