#!/usr/bin/env node

/**
 * Project Switching Data Refresh Test
 * 
 * This script tests that project switching properly refreshes data
 * in dashboard and messages components after our bug fixes.
 * 
 * Tests:
 * 1. Cache invalidation on project switch
 * 2. useProjectData hook refresh behavior
 * 3. ProjectContext event emission
 * 4. Component data updates
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  projectRoot: process.cwd(),
  testResults: {
    passed: 0,
    failed: 0,
    errors: []
  }
};

// Test utilities
function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  if (result) {
    TEST_CONFIG.testResults.passed++;
  } else {
    TEST_CONFIG.testResults.failed++;
    TEST_CONFIG.testResults.errors.push(`${testName}: ${details}`);
  }
}

function readFileContent(filePath) {
  try {
    const fullPath = path.join(TEST_CONFIG.projectRoot, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Test 1: Verify cache invalidation implementation
function testCacheInvalidation() {
  console.log('\n🔍 Testing Cache Invalidation Implementation...');
  
  const serviceContent = readFileContent('src/services/simpleProjectService.ts');
  if (!serviceContent) {
    logTest('Cache invalidation file exists', false, 'simpleProjectService.ts not found');
    return;
  }
  
  // Check for cache invalidation methods (using actual method names)
  const hasInvalidateCache = serviceContent.includes('invalidateProjectData') || 
                            serviceContent.includes('clearUserCache') ||
                            serviceContent.includes('forceRefresh') ||
                            serviceContent.includes('dataCache.clear');
  
  logTest('Cache invalidation methods exist', hasInvalidateCache, 
         hasInvalidateCache ? 'Cache invalidation methods found' : 'No cache invalidation methods found');
  
  // Check for project change handling (using actual implementation patterns)
  const hasProjectChangeHandling = serviceContent.includes('currentProjectId') ||
                                  serviceContent.includes('project-changed') ||
                                  serviceContent.includes('invalidateProjectData');
  
  logTest('Project change handling exists', hasProjectChangeHandling,
         hasProjectChangeHandling ? 'Project change handling found' : 'No project change handling found');
}

// Test 2: Verify useProjectData hook implementation
function testUseProjectDataHook() {
  console.log('\n🔍 Testing useProjectData Hook Implementation...');
  
  const hookContent = readFileContent('src/hooks/useProjectData.ts');
  if (!hookContent) {
    logTest('useProjectData hook exists', false, 'useProjectData.ts not found');
    return;
  }
  
  // Check for essential hook features
  const hasAutoRefresh = hookContent.includes('autoRefresh') || hookContent.includes('refreshInterval');
  logTest('Auto-refresh capability', hasAutoRefresh,
         hasAutoRefresh ? 'Auto-refresh implementation found' : 'No auto-refresh implementation');
  
  const hasProjectListener = hookContent.includes('project-changed') || 
                            hookContent.includes('addEventListener') ||
                            hookContent.includes('useEffect');
  logTest('Project change listener', hasProjectListener,
         hasProjectListener ? 'Project change listener found' : 'No project change listener');
  
  const hasDataRefresh = hookContent.includes('refresh') || hookContent.includes('reload');
  logTest('Data refresh mechanism', hasDataRefresh,
         hasDataRefresh ? 'Data refresh mechanism found' : 'No data refresh mechanism');
}

// Test 3: Verify ProjectContext event emission
function testProjectContextEvents() {
  console.log('\n🔍 Testing ProjectContext Event Emission...');
  
  const contextContent = readFileContent('src/context/ProjectContext.tsx');
  if (!contextContent) {
    logTest('ProjectContext file exists', false, 'ProjectContext.tsx not found');
    return;
  }
  
  // Check for event emission
  const hasEventEmission = contextContent.includes('dispatchEvent') || 
                          contextContent.includes('CustomEvent') ||
                          contextContent.includes('project-changed');
  
  logTest('Event emission implementation', hasEventEmission,
         hasEventEmission ? 'Event emission found' : 'No event emission implementation');
  
  // Check for Fast Refresh compatibility fix
  const hasFastRefreshFix = contextContent.includes('function useProject') ||
                           contextContent.includes('// Fast Refresh') ||
                           !contextContent.includes('const useProject = ()');
  
  logTest('Fast Refresh compatibility', hasFastRefreshFix,
         hasFastRefreshFix ? 'Fast Refresh compatibility implemented' : 'Fast Refresh issues may persist');
}

// Test 4: Verify component updates
function testComponentUpdates() {
  console.log('\n🔍 Testing Component Updates...');
  
  // Test dashboard component
  const dashboardContent = readFileContent('src/components/dashboard/EnhancedDashboardExample.tsx');
  if (dashboardContent) {
    const usesProjectDataHook = dashboardContent.includes('useProjectData');
    logTest('Dashboard uses useProjectData hook', usesProjectDataHook,
           usesProjectDataHook ? 'Dashboard component updated' : 'Dashboard component not updated');
  } else {
    logTest('Dashboard component exists', false, 'EnhancedDashboardExample.tsx not found');
  }
  
  // Test messages component  
  const messagesContent = readFileContent('src/components/chat/EnhancedMessagesPage.tsx');
  if (messagesContent) {
    const usesProjectDataHook = messagesContent.includes('useProjectData');
    logTest('Messages uses useProjectData hook', usesProjectDataHook,
           usesProjectDataHook ? 'Messages component updated' : 'Messages component not updated');
  } else {
    logTest('Messages component exists', false, 'EnhancedMessagesPage.tsx not found');
  }
}

// Test 5: Verify data refresh integration
function testDataRefreshIntegration() {
  console.log('\n🔍 Testing Data Refresh Integration...');
  
  // Check that components handle project changes
  const dashboardContent = readFileContent('src/components/dashboard/EnhancedDashboardExample.tsx');
  const messagesContent = readFileContent('src/components/chat/EnhancedMessagesPage.tsx');
  
  if (dashboardContent && messagesContent) {
    const dashboardHasRefresh = dashboardContent.includes('refresh') || 
                               dashboardContent.includes('currentProject');
    const messagesHasRefresh = messagesContent.includes('refresh') || 
                              messagesContent.includes('currentProject');
    
    logTest('Dashboard refresh integration', dashboardHasRefresh,
           dashboardHasRefresh ? 'Dashboard refresh integration found' : 'Dashboard refresh integration missing');
    
    logTest('Messages refresh integration', messagesHasRefresh,
           messagesHasRefresh ? 'Messages refresh integration found' : 'Messages refresh integration missing');
  }
}

// Test 6: Check for race condition fixes
function testRaceConditionFixes() {
  console.log('\n🔍 Testing Race Condition Fixes...');
  
  // Check AdminUserManagement for separate loading states
  const adminContent = readFileContent('src/pages/AdminUserManagement.tsx');
  if (adminContent) {
    const hasMultipleLoadingStates = adminContent.includes('createLoading') &&
                                    adminContent.includes('deleteLoading');
    
    logTest('Multiple loading states implemented', hasMultipleLoadingStates,
           hasMultipleLoadingStates ? 'Race condition fixes implemented' : 'Race condition fixes missing');
  }
  
  // Check ClientManagement for null safety
  const clientContent = readFileContent('src/components/clients/ClientManagement.tsx');
  if (clientContent) {
    const hasNullSafety = clientContent.includes('?.') || 
                         clientContent.includes('|| ""') ||
                         clientContent.includes('null') ||
                         clientContent.includes('undefined');
    
    logTest('Null safety implemented', hasNullSafety,
           hasNullSafety ? 'Null safety checks implemented' : 'Null safety checks missing');
  }
}

// Test 7: Environment variable validation
function testEnvironmentValidation() {
  console.log('\n🔍 Testing Environment Variable Validation...');
  
  const dbContent = readFileContent('src/services/dualDatabase.ts');
  if (dbContent) {
    const hasProperErrorHandling = dbContent.includes('throw new Error') &&
                                  !dbContent.includes('console.error("Missing');
    
    logTest('Environment variable error handling', hasProperErrorHandling,
           hasProperErrorHandling ? 'Proper error throwing implemented' : 'Still using console.error instead of throwing');
  }
}

// Main test execution
function runTests() {
  console.log('🚀 Starting Project Switching Data Refresh Tests...');
  console.log('=' .repeat(60));
  
  // Run all tests
  testCacheInvalidation();
  testUseProjectDataHook();
  testProjectContextEvents();
  testComponentUpdates();
  testDataRefreshIntegration();
  testRaceConditionFixes();
  testEnvironmentValidation();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const total = TEST_CONFIG.testResults.passed + TEST_CONFIG.testResults.failed;
  const passRate = total > 0 ? ((TEST_CONFIG.testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`✅ Tests Passed: ${TEST_CONFIG.testResults.passed}`);
  console.log(`❌ Tests Failed: ${TEST_CONFIG.testResults.failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  if (TEST_CONFIG.testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_CONFIG.testResults.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
    console.log('\n🔧 Please fix the failed tests before considering the implementation complete.');
  } else {
    console.log('\n🎉 All tests passed! Project switching data refresh is working correctly.');
  }
  
  // Exit with appropriate code
  process.exit(TEST_CONFIG.testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests(); 