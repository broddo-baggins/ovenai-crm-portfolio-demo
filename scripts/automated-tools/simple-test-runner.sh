#!/bin/bash

# 🧪 SIMPLE TEST RUNNER (Debug Version)
# A simplified version to debug the comprehensive test runner

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 SIMPLE TEST RUNNER (Debug Mode)${NC}"

# Create simple timestamp  
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RUN_DIR="test-results/simple_run_${TIMESTAMP}"

echo "Creating test directory: ${RUN_DIR}"
mkdir -p "${RUN_DIR}"
mkdir -p "${RUN_DIR}/logs"

# Test basic operations
echo "Testing directory creation..." 
echo "Test content" > "${RUN_DIR}/test.txt"
echo "✅ File creation works"

# Test lint
echo -e "\n${YELLOW}Running lint check...${NC}"
if npm run lint:check > "${RUN_DIR}/logs/lint.txt" 2>&1; then
    echo -e "${GREEN}✅ Lint passed${NC}"
    LINT_STATUS="PASSED"
else
    echo -e "${RED}❌ Lint failed${NC}"
    LINT_STATUS="FAILED"
fi

# Test type check
echo -e "\n${YELLOW}Running type check...${NC}"
if npm run type-check > "${RUN_DIR}/logs/typecheck.txt" 2>&1; then
    echo -e "${GREEN}✅ Type check passed${NC}"
    TYPE_STATUS="PASSED"
else
    echo -e "${RED}❌ Type check failed${NC}"
    TYPE_STATUS="FAILED"
fi

# Test unit tests  
echo -e "\n${YELLOW}Running unit tests...${NC}"
if npm run test:run > "${RUN_DIR}/logs/unit-tests.txt" 2>&1; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
    UNIT_STATUS="PASSED"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    UNIT_STATUS="FAILED"
fi

# Test build
echo -e "\n${YELLOW}Running build...${NC}"
if npm run build > "${RUN_DIR}/logs/build.txt" 2>&1; then
    echo -e "${GREEN}✅ Build passed${NC}"
    BUILD_STATUS="PASSED"
else
    echo -e "${RED}❌ Build failed${NC}"
    BUILD_STATUS="FAILED"
fi

# Test E2E (simplified)
echo -e "\n${YELLOW}Testing E2E setup...${NC}"
if command -v playwright >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Playwright available${NC}"
    E2E_AVAILABLE="YES"
    
    # Try a simple playwright command
    if npx playwright --version > "${RUN_DIR}/logs/playwright.txt" 2>&1; then
        echo -e "${GREEN}✅ Playwright works${NC}"
        E2E_STATUS="AVAILABLE"
    else
        echo -e "${RED}❌ Playwright command failed${NC}"
        E2E_STATUS="FAILED"
    fi
else
    echo -e "${RED}❌ Playwright not available${NC}"
    E2E_AVAILABLE="NO"
    E2E_STATUS="NOT_AVAILABLE"
fi

# Create summary
echo -e "\n${BLUE}📊 CREATING SUMMARY${NC}"
SUMMARY_FILE="${RUN_DIR}/SIMPLE_SUMMARY.md"

cat > "${SUMMARY_FILE}" << EOF
# 🧪 SIMPLE TEST RUNNER RESULTS

**Run Date**: $(date)
**Run ID**: ${TIMESTAMP}

## Test Results

### Code Quality
- **Lint Check**: ${LINT_STATUS}
- **Type Check**: ${TYPE_STATUS}

### Testing
- **Unit Tests**: ${UNIT_STATUS}
- **E2E Available**: ${E2E_AVAILABLE}
- **E2E Status**: ${E2E_STATUS}

### Build
- **Production Build**: ${BUILD_STATUS}

## Files Generated
- **Logs**: logs/ directory
- **Test Results**: ${RUN_DIR}

## Next Steps
If all tests show PASSED, then the issue is with the comprehensive test runner script.
If tests show FAILED, then we need to fix the underlying issues first.

## Log Files
- Lint: logs/lint.txt
- Type Check: logs/typecheck.txt  
- Unit Tests: logs/unit-tests.txt
- Build: logs/build.txt
- Playwright: logs/playwright.txt
EOF

echo -e "${GREEN}✅ Summary created: ${SUMMARY_FILE}${NC}"

# Show results
echo -e "\n${BLUE}📋 SUMMARY:${NC}"
echo "- Lint: ${LINT_STATUS}"
echo "- Type: ${TYPE_STATUS}"  
echo "- Unit: ${UNIT_STATUS}"
echo "- Build: ${BUILD_STATUS}"
echo "- E2E: ${E2E_STATUS}"

# Determine overall status
if [[ "${LINT_STATUS}" == "PASSED" && "${TYPE_STATUS}" == "PASSED" && "${BUILD_STATUS}" == "PASSED" ]]; then
    echo -e "\n${GREEN}🎉 CORE FUNCTIONALITY WORKING${NC}"
    echo -e "${YELLOW}Note: Unit tests and E2E need fixes, but build pipeline is solid${NC}"
else
    echo -e "\n${RED}❌ CORE ISSUES DETECTED${NC}"
    echo -e "${YELLOW}Fix these before working on comprehensive test runner${NC}"
fi

echo -e "\n${BLUE}Results saved to: ${RUN_DIR}${NC}" 