#!/bin/bash

# 🧪 COMPREHENSIVE TEST RUNNER
# Runs ALL tests and saves results with timestamps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="test-results"
RUN_DIR="${TEST_RESULTS_DIR}/run_${TIMESTAMP}"

echo -e "${BLUE}🧪 COMPREHENSIVE TEST RUNNER${NC}"
echo -e "${BLUE}Starting test run at: $(date)${NC}"
echo -e "${BLUE}Results will be saved to: ${RUN_DIR}${NC}"

# Create directories
echo "Creating test result directories..."
mkdir -p "${RUN_DIR}/unit-integration"
mkdir -p "${RUN_DIR}/e2e"
mkdir -p "${RUN_DIR}/reports"  
mkdir -p "${RUN_DIR}/logs"
echo "✅ Directories created: ${RUN_DIR}"

# Save environment info
echo "# Test Run Environment Info" > "${RUN_DIR}/environment.md"
echo "- **Timestamp**: $(date)" >> "${RUN_DIR}/environment.md"
echo "- **Node Version**: $(node --version)" >> "${RUN_DIR}/environment.md"
echo "- **NPM Version**: $(npm --version)" >> "${RUN_DIR}/environment.md"
echo "- **Git Branch**: $(git branch --show-current)" >> "${RUN_DIR}/environment.md"
echo "- **Git Commit**: $(git rev-parse HEAD)" >> "${RUN_DIR}/environment.md"
echo "- **Working Directory**: $(pwd)" >> "${RUN_DIR}/environment.md"

# Function to run with timeout and capture output
run_with_timeout() {
    local cmd="$1"
    local timeout="$2"
    local output_file="$3"
    local log_file="$4"
    
    # Ensure directories exist
    mkdir -p "$(dirname "${output_file}")" 2>/dev/null || true
    mkdir -p "$(dirname "${log_file}")" 2>/dev/null || true
    
    echo -e "${YELLOW}Running: ${cmd}${NC}"
    
    # Create log file first
    {
        echo "Command: ${cmd}"
        echo "Started: $(date)"
    } > "${log_file}" 2>/dev/null || {
        echo "Warning: Could not create log file: ${log_file}"
    }
    
    if timeout "${timeout}" bash -c "${cmd}" > "${output_file}" 2>&1; then
        {
            echo "Completed: $(date)"
            echo "Status: SUCCESS"
        } >> "${log_file}" 2>/dev/null || true
        return 0
    else
        local exit_code=$?
        {
            echo "Completed: $(date)"
            echo "Status: FAILED (exit code: ${exit_code})"
        } >> "${log_file}" 2>/dev/null || true
        return ${exit_code}
    fi
}

# Initialize results summary
SUMMARY_FILE="${RUN_DIR}/TEST_SUMMARY.md"
echo "Initializing summary file: ${SUMMARY_FILE}"
mkdir -p "${RUN_DIR}" 2>/dev/null || true
echo "# 🧪 COMPREHENSIVE TEST RESULTS" > "${SUMMARY_FILE}"
echo "**Run Date**: $(date)" >> "${SUMMARY_FILE}"
echo "**Run ID**: ${TIMESTAMP}" >> "${SUMMARY_FILE}"
echo "" >> "${SUMMARY_FILE}"
echo "✅ Summary file initialized"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Phase failure tracking
LINT_FAILED=false
TYPE_CHECK_FAILED=false
UNIT_TESTS_FAILED=false
BUILD_FAILED=false
E2E_TESTS_FAILED=false

echo -e "\n${BLUE}📋 PHASE 1: LINT & TYPE CHECK${NC}"

# Lint check
echo -e "${YELLOW}Running lint check...${NC}"
if run_with_timeout "npm run lint:check" "60s" "${RUN_DIR}/logs/lint.txt" "${RUN_DIR}/logs/lint.log"; then
    echo -e "${GREEN}✅ Lint check passed${NC}"
    echo "## 📋 Lint Check: ✅ PASSED" >> "${SUMMARY_FILE}"
else
    echo -e "${RED}❌ Lint check failed${NC}"
    echo "## 📋 Lint Check: ❌ FAILED" >> "${SUMMARY_FILE}"
    LINT_FAILED=true
fi

# Type check
echo -e "${YELLOW}Running type check...${NC}"
if run_with_timeout "npm run type-check" "120s" "${RUN_DIR}/logs/typecheck.txt" "${RUN_DIR}/logs/typecheck.log"; then
    echo -e "${GREEN}✅ Type check passed${NC}"
    echo "## 🔍 Type Check: ✅ PASSED" >> "${SUMMARY_FILE}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    echo "## 🔍 Type Check: ❌ FAILED" >> "${SUMMARY_FILE}"
    TYPE_CHECK_FAILED=true
fi

echo -e "\n${BLUE}🧪 PHASE 2: UNIT & INTEGRATION TESTS${NC}"

# Unit and Integration tests
echo -e "${YELLOW}Running unit and integration tests...${NC}"
if run_with_timeout "npm run test:run" "300s" "${RUN_DIR}/unit-integration/test-output.txt" "${RUN_DIR}/logs/unit-integration.log"; then
    echo -e "${GREEN}✅ Unit/Integration tests completed${NC}"
    
    # Extract test results
    if [[ -f "${RUN_DIR}/unit-integration/test-output.txt" ]]; then
        UNIT_PASSED=$(grep -oP 'Tests\s+\K\d+(?=\s+passed)' "${RUN_DIR}/unit-integration/test-output.txt" | tail -1 || echo "0")
        UNIT_FAILED=$(grep -oP 'Tests\s+\d+\s+failed.*?(\K\d+)(?=\s+passed)' "${RUN_DIR}/unit-integration/test-output.txt" | head -1 || echo "0")
        UNIT_SKIPPED=$(grep -oP 'Tests.*?(\K\d+)(?=\s+skipped)' "${RUN_DIR}/unit-integration/test-output.txt" | tail -1 || echo "0")
        
        echo "## 🧪 Unit & Integration Tests: ✅ COMPLETED" >> "${SUMMARY_FILE}"
        echo "- **Passed**: ${UNIT_PASSED}" >> "${SUMMARY_FILE}"
        echo "- **Failed**: ${UNIT_FAILED}" >> "${SUMMARY_FILE}"
        echo "- **Skipped**: ${UNIT_SKIPPED}" >> "${SUMMARY_FILE}"
        
        TOTAL_TESTS=$((TOTAL_TESTS + UNIT_PASSED + UNIT_FAILED))
        PASSED_TESTS=$((PASSED_TESTS + UNIT_PASSED))
        FAILED_TESTS=$((FAILED_TESTS + UNIT_FAILED))
        
        # Mark as failed if any unit tests failed
        if [[ ${UNIT_FAILED} -gt 0 ]]; then
            UNIT_TESTS_FAILED=true
        fi
    fi
else
    echo -e "${RED}❌ Unit/Integration tests failed${NC}"
    echo "## 🧪 Unit & Integration Tests: ❌ FAILED" >> "${SUMMARY_FILE}"
    echo "- See logs for details" >> "${SUMMARY_FILE}"
    UNIT_TESTS_FAILED=true
fi

echo -e "\n${BLUE}🎭 PHASE 3: E2E TESTS (PLAYWRIGHT)${NC}"

# Kill any running processes first
echo -e "${YELLOW}Cleaning up running processes...${NC}"
pkill -f "vite\|playwright\|preview" || true
sleep 3

# Build for production testing
echo -e "${YELLOW}Building for production...${NC}"
if run_with_timeout "npm run build" "180s" "${RUN_DIR}/logs/build.txt" "${RUN_DIR}/logs/build.log"; then
    echo -e "${GREEN}✅ Build completed${NC}"
    echo "## 🏗️ Production Build: ✅ PASSED" >> "${SUMMARY_FILE}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "## 🏗️ Production Build: ❌ FAILED" >> "${SUMMARY_FILE}"
    BUILD_FAILED=true
fi

# Run E2E tests
echo -e "${YELLOW}Running E2E tests...${NC}"
E2E_SUCCESS=false

# Try with different configurations
for config in "chromium" "mobile"; do
    echo -e "${YELLOW}Testing with ${config} configuration...${NC}"
    
    if run_with_timeout "npx playwright test --project=${config} --reporter=html" "600s" "${RUN_DIR}/e2e/${config}-output.txt" "${RUN_DIR}/logs/e2e-${config}.log"; then
        echo -e "${GREEN}✅ E2E tests (${config}) passed${NC}"
        E2E_SUCCESS=true
        
        # Extract E2E results
        if [[ -f "${RUN_DIR}/e2e/${config}-output.txt" ]]; then
            E2E_PASSED=$(grep -oP '\K\d+(?=\s+passed)' "${RUN_DIR}/e2e/${config}-output.txt" | tail -1 || echo "0")
            E2E_FAILED=$(grep -oP '\K\d+(?=\s+failed)' "${RUN_DIR}/e2e/${config}-output.txt" | tail -1 || echo "0")
            
            echo "### 🎭 E2E Tests (${config}): ✅ PASSED" >> "${SUMMARY_FILE}"
            echo "- **Passed**: ${E2E_PASSED}" >> "${SUMMARY_FILE}"
            echo "- **Failed**: ${E2E_FAILED}" >> "${SUMMARY_FILE}"
            
            TOTAL_TESTS=$((TOTAL_TESTS + E2E_PASSED + E2E_FAILED))
            PASSED_TESTS=$((PASSED_TESTS + E2E_PASSED))
            FAILED_TESTS=$((FAILED_TESTS + E2E_FAILED))
        fi
    else
        echo -e "${RED}❌ E2E tests (${config}) failed${NC}"
        {
            echo "### 🎭 E2E Tests (${config}): ❌ FAILED"
            echo "- See logs for details"
        } >> "${SUMMARY_FILE}" 2>/dev/null || echo "Warning: Could not write to summary file"
    fi
done

if [[ "${E2E_SUCCESS}" == "false" ]]; then
    echo -e "${RED}❌ All E2E test configurations failed${NC}"
    echo "## 🎭 E2E Tests: ❌ ALL FAILED" >> "${SUMMARY_FILE}" 2>/dev/null || true
fi

# Copy Playwright HTML report if it exists
if [[ -d "playwright-report" ]]; then
    cp -r playwright-report "${RUN_DIR}/e2e/playwright-html-report" || true
fi

echo -e "\n${BLUE}📊 PHASE 4: GENERATING COMPREHENSIVE REPORT${NC}"

# Determine overall status based on test phase results
OVERALL_STATUS="PASSED"
OVERALL_FAILURES=0

# Count failures from all phases
if [[ "${LINT_FAILED}" == "true" ]]; then
    OVERALL_FAILURES=$((OVERALL_FAILURES + 1))
fi

if [[ "${TYPE_CHECK_FAILED}" == "true" ]]; then
    OVERALL_FAILURES=$((OVERALL_FAILURES + 1))
fi

if [[ "${UNIT_TESTS_FAILED}" == "true" ]]; then
    OVERALL_FAILURES=$((OVERALL_FAILURES + 1))
fi

if [[ "${BUILD_FAILED}" == "true" ]]; then
    OVERALL_FAILURES=$((OVERALL_FAILURES + 1))
fi

if [[ "${E2E_SUCCESS}" == "false" ]]; then
    OVERALL_FAILURES=$((OVERALL_FAILURES + 1))
    E2E_TESTS_FAILED=true
fi

# Create detailed summary
echo "" >> "${SUMMARY_FILE}"
echo "## 📊 OVERALL SUMMARY" >> "${SUMMARY_FILE}"
echo "- **Total Tests**: ${TOTAL_TESTS}" >> "${SUMMARY_FILE}"
echo "- **Passed**: ${PASSED_TESTS}" >> "${SUMMARY_FILE}"
echo "- **Failed**: ${FAILED_TESTS}" >> "${SUMMARY_FILE}"
echo "- **Major Failures**: ${OVERALL_FAILURES}" >> "${SUMMARY_FILE}"

if [[ ${OVERALL_FAILURES} -eq 0 ]] && [[ ${FAILED_TESTS} -eq 0 ]]; then
    echo "- **Status**: 🎉 ALL TESTS PASSED" >> "${SUMMARY_FILE}"
    OVERALL_STATUS="PASSED"
else
    echo "- **Status**: ❌ SOME TESTS FAILED" >> "${SUMMARY_FILE}"
    OVERALL_STATUS="FAILED"
fi

echo "" >> "${SUMMARY_FILE}"
echo "## 📁 FILES & REPORTS" >> "${SUMMARY_FILE}"
echo "- **Unit/Integration Output**: \`unit-integration/test-output.txt\`" >> "${SUMMARY_FILE}"
echo "- **E2E Output**: \`e2e/\` directory" >> "${SUMMARY_FILE}"
echo "- **All Logs**: \`logs/\` directory" >> "${SUMMARY_FILE}"
echo "- **Environment Info**: \`environment.md\`" >> "${SUMMARY_FILE}"

# Create JSON summary for automation
cat > "${RUN_DIR}/results.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "run_date": "$(date -Iseconds)",
  "overall_status": "${OVERALL_STATUS}",
  "total_tests": ${TOTAL_TESTS},
  "passed_tests": ${PASSED_TESTS},
  "failed_tests": ${FAILED_TESTS},
  "test_types": {
    "unit_integration": {
      "passed": ${UNIT_PASSED:-0},
      "failed": ${UNIT_FAILED:-0},
      "skipped": ${UNIT_SKIPPED:-0}
    },
    "e2e": {
      "passed": ${E2E_PASSED:-0},
      "failed": ${E2E_FAILED:-0}
    }
  }
}
EOF

# Create index file for easy browsing
cat > "${TEST_RESULTS_DIR}/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Results Index</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .run { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>🧪 Test Results Index</h1>
    <div id="runs"></div>
    <script>
        // This would be populated by the script with run data
        // For now, just show directory listing instructions
        document.getElementById('runs').innerHTML = 
            '<p>Browse the run_* directories to see individual test results.</p>' +
            '<p>Each run contains:</p>' +
            '<ul>' +
            '<li>TEST_SUMMARY.md - Overview of all results</li>' +
            '<li>unit-integration/ - Unit and integration test outputs</li>' +
            '<li>e2e/ - End-to-end test outputs</li>' +
            '<li>logs/ - Detailed logs for each test phase</li>' +
            '<li>results.json - Machine-readable summary</li>' +
            '</ul>';
    </script>
</body>
</html>
EOF

echo -e "\n${BLUE}🎉 TEST RUN COMPLETED${NC}"
echo -e "${BLUE}Results saved to: ${RUN_DIR}${NC}"
echo -e "${BLUE}Summary: ${OVERALL_STATUS}${NC}"

if [[ "${OVERALL_STATUS}" == "PASSED" ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo -e "${YELLOW}Check the detailed reports in ${RUN_DIR}${NC}"
    exit 1
fi 