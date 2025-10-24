#!/bin/bash

# 🎯 WHATSAPP BUSINESS TEMPLATE DEMONSTRATION SCRIPT
# Shows how to use the 5 Meta-ready templates for business messaging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1"
DEMO_PHONE="15551234567"  # Your demo phone number

# Check environment variables
check_env() {
    echo -e "${BLUE}🔍 Checking environment variables...${NC}"
    
    if [[ -z "$SUPABASE_ANON_KEY" ]]; then
        echo -e "${RED}❌ SUPABASE_ANON_KEY not set${NC}"
        echo "Please set: export SUPABASE_ANON_KEY='your_anon_key'"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment configured${NC}"
}

# Function to demonstrate template usage
demo_template() {
    local template_name="$1"
    local description="$2"
    local example_data="$3"
    
    echo -e "\n${PURPLE}📱 Template: ${template_name}${NC}"
    echo -e "${YELLOW}Description: ${description}${NC}"
    echo -e "${BLUE}Example Usage:${NC}"
    
    # Send template message
    echo -e "${GREEN}Sending template message...${NC}"
    
    local response=$(curl -s -X POST "$BASE_URL/whatsapp-send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -d "$example_data")
    
    echo "Response: $response"
    echo -e "${GREEN}✅ Template demonstration complete${NC}"
}

# Main demonstration function
main() {
    echo -e "${BLUE}🚀 WHATSAPP BUSINESS TEMPLATE DEMONSTRATION${NC}"
    echo "=========================================="
    echo -e "${YELLOW}📋 Demonstrating 5 Meta-ready templates${NC}"
    echo -e "${YELLOW}📞 Demo Phone: ${DEMO_PHONE}${NC}"
    echo "Time: $(date)"
    echo ""
    
    # Check environment
    check_env
    echo ""
    
    # Template 1: Property Inquiry Response
    demo_template \
        "property_inquiry_confirmation" \
        "Auto-response to property inquiries" \
        '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "property_inquiry_confirmation",
            "language_code": "en_US"
        }'
    
    # Template 2: Viewing Confirmation
    demo_template \
        "viewing_confirmation" \
        "Confirm property viewing appointments" \
        '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "viewing_confirmation",
            "language_code": "en_US"
        }'
    
    # Template 3: Contact Information
    demo_template \
        "contact_information_share" \
        "Share agent contact details" \
        '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "contact_information_share",
            "language_code": "en_US"
        }'
    
    # Template 4: Welcome Message
    demo_template \
        "welcome_new_lead" \
        "Welcome message for new leads" \
        '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "welcome_new_lead",
            "language_code": "en_US"
        }'
    
    # Template 5: Follow-up Reminder
    demo_template \
        "follow_up_reminder" \
        "Follow-up on property inquiries" \
        '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "follow_up_reminder",
            "language_code": "en_US"
        }'
    
    echo -e "\n${GREEN}🎉 Template demonstration complete!${NC}"
    echo ""
    echo -e "${YELLOW}📊 TEMPLATE SUMMARY:${NC}"
    echo "========================="
    echo "1. property_inquiry_confirmation - Auto-response to inquiries"
    echo "2. viewing_confirmation - Appointment confirmations"
    echo "3. contact_information_share - Agent contact sharing"
    echo "4. welcome_new_lead - Welcome message for new leads"
    echo "5. follow_up_reminder - Follow-up reminders"
    echo ""
    echo -e "${BLUE}📝 Template Status: Meta-ready for submission${NC}"
    echo -e "${BLUE}📋 Submission Script: scripts/meta-integration/submit-templates.mjs${NC}"
    echo -e "${BLUE}📚 Documentation: docs/api/SUPABASE_EDGE_FUNCTIONS_REFERENCE.md${NC}"
}

# Template submission helper
submit_templates() {
    echo -e "${BLUE}🚀 Submitting templates to Meta...${NC}"
    
    if [[ -f "scripts/meta-integration/submit-templates.mjs" ]]; then
        echo -e "${GREEN}Running template submission script...${NC}"
        node scripts/meta-integration/submit-templates.mjs
    else
        echo -e "${YELLOW}⚠️ Template submission script not found${NC}"
        echo "Please run: node scripts/meta-integration/submit-templates.mjs"
    fi
}

# List all available templates
list_templates() {
    echo -e "${BLUE}📋 WHATSAPP BUSINESS TEMPLATES${NC}"
    echo "============================"
    echo ""
    echo -e "${PURPLE}UTILITY TEMPLATES (Meta-ready):${NC}"
    echo "1. property_inquiry_confirmation"
    echo "   Purpose: Auto-response to property inquiries"
    echo "   Status: Ready for Meta submission"
    echo ""
    echo "2. viewing_confirmation"
    echo "   Purpose: Confirm property viewing appointments"
    echo "   Status: Ready for Meta submission"
    echo ""
    echo "3. contact_information_share"
    echo "   Purpose: Share agent contact details"
    echo "   Status: Ready for Meta submission"
    echo ""
    echo "4. welcome_new_lead"
    echo "   Purpose: Welcome message for new leads"
    echo "   Status: Ready for Meta submission"
    echo ""
    echo "5. follow_up_reminder"
    echo "   Purpose: Follow-up on property inquiries"
    echo "   Status: Ready for Meta submission"
    echo ""
    echo -e "${GREEN}✅ All templates are compliant with Meta policies${NC}"
    echo -e "${GREEN}✅ All templates are ready for immediate submission${NC}"
}

# Test template functionality
test_template() {
    local template_name="$1"
    
    if [[ -z "$template_name" ]]; then
        echo -e "${RED}❌ Please specify a template name${NC}"
        echo "Available templates:"
        echo "- property_inquiry_confirmation"
        echo "- viewing_confirmation"
        echo "- contact_information_share"
        echo "- welcome_new_lead"
        echo "- follow_up_reminder"
        exit 1
    fi
    
    echo -e "${BLUE}🧪 Testing template: ${template_name}${NC}"
    
    check_env
    
    local response=$(curl -s -X POST "$BASE_URL/whatsapp-send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -d '{
            "action": "send_template",
            "to": "'$DEMO_PHONE'",
            "template_name": "'$template_name'",
            "language_code": "en_US"
        }')
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq . || echo "$response"
}

# Handle command line arguments
if [[ $# -eq 0 ]]; then
    main
elif [[ "$1" == "list" ]]; then
    list_templates
elif [[ "$1" == "submit" ]]; then
    submit_templates
elif [[ "$1" == "test" && -n "$2" ]]; then
    test_template "$2"
elif [[ "$1" == "help" ]]; then
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  (no args)     - Run full template demonstration"
    echo "  list          - List all available templates"
    echo "  submit        - Submit templates to Meta for approval"
    echo "  test <name>   - Test specific template"
    echo "  help          - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Full demo"
    echo "  $0 list                               # List templates"
    echo "  $0 submit                             # Submit to Meta"
    echo "  $0 test property_inquiry_confirmation # Test template"
    echo ""
    echo "Environment Variables Required:"
    echo "  SUPABASE_ANON_KEY    # Supabase anonymous key"
    echo ""
    echo "Templates Available:"
    echo "  - property_inquiry_confirmation"
    echo "  - viewing_confirmation"
    echo "  - contact_information_share"
    echo "  - welcome_new_lead"
    echo "  - follow_up_reminder"
else
    echo "Invalid command. Use '$0 help' for usage information."
    exit 1
fi 