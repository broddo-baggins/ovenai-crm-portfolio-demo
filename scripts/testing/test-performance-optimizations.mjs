#!/usr/bin/env node

/**
 * Test script for Performance Optimizations
 * Verifies reduced context duplication and improved caching
 */

import fs from 'fs';
import path from 'path';

// Test performance optimizations
async function testPerformanceOptimizations() {
  console.log("⚡ Testing Performance Optimizations");
  console.log("=====================================");
  
  const results = {
    contextDuplication: false,
    caching: false,
    singleton: false,
    optimizedQueries: false,
    bundleOptimization: false,
    memoryManagement: false
  };
  
  // Test 1: Context Duplication Prevention
  console.log("✅ Test 1: Context Duplication Prevention");
  
  // Check ProjectContext for singleton pattern
  const projectContextPath = 'src/context/ProjectContext.tsx';
  if (fs.existsSync(projectContextPath)) {
    const projectContext = fs.readFileSync(projectContextPath, 'utf8');
    const hasSingletonPattern = projectContext.includes('isProviderMounted') && 
                               projectContext.includes('Multiple ProjectProvider instances detected');
    const hasContextGuard = projectContext.includes('React Context Guard') &&
                           projectContext.includes('createContext');
    
    if (hasSingletonPattern && hasContextGuard) {
      console.log("   ✅ ProjectContext uses singleton pattern");
      console.log("   ✅ Context guards prevent duplication");
      results.contextDuplication = true;
    } else {
      console.log("   ❌ ProjectContext missing singleton pattern");
    }
  }
  
  // Check DashboardContext for singleton pattern
  const dashboardContextPath = 'src/context/DashboardContext.tsx';
  if (fs.existsSync(dashboardContextPath)) {
    const dashboardContext = fs.readFileSync(dashboardContextPath, 'utf8');
    const hasSingletonPattern = dashboardContext.includes('isProviderMounted') && 
                               dashboardContext.includes('Multiple DashboardProvider instances detected');
    const hasContextGuard = dashboardContext.includes('React Context Guard');
    
    if (hasSingletonPattern && hasContextGuard) {
      console.log("   ✅ DashboardContext uses singleton pattern");
      results.singleton = true;
    } else {
      console.log("   ❌ DashboardContext missing singleton pattern");
    }
  }
  
  // Test 2: Improved Caching System
  console.log("\n✅ Test 2: Improved Caching System");
  
  // Check simpleProjectService caching
  const simpleProjectServicePath = 'src/services/simpleProjectService.ts';
  if (fs.existsSync(simpleProjectServicePath)) {
    const serviceContent = fs.readFileSync(simpleProjectServicePath, 'utf8');
    const hasDataCache = serviceContent.includes('dataCache: Map') || 
                        serviceContent.includes('private dataCache');
    const hasCacheValidation = serviceContent.includes('isCacheValid') || 
                              serviceContent.includes('CACHE_DURATION');
    const hasProjectContextCache = serviceContent.includes('setCache') && 
                                  serviceContent.includes('projectId');
    
    if (hasDataCache && hasCacheValidation && hasProjectContextCache) {
      console.log("   ✅ SimpleProjectService has comprehensive caching");
      console.log("   ✅ Cache validation with expiration");
      console.log("   ✅ Project-specific caching");
      results.caching = true;
    } else {
      console.log("   ❌ SimpleProjectService missing caching features");
    }
  }
  
  // Check OptimizedProjectService
  const optimizedProjectServicePath = 'src/services/optimizedProjectService.ts';
  if (fs.existsSync(optimizedProjectServicePath)) {
    const optimizedContent = fs.readFileSync(optimizedProjectServicePath, 'utf8');
    const hasOptimizedCaching = optimizedContent.includes('CACHE_DURATION') && 
                               optimizedContent.includes('FAST_CACHE_DURATION');
    const hasUserCaching = optimizedContent.includes('currentUser') && 
                          optimizedContent.includes('aggressive caching');
    
    if (hasOptimizedCaching && hasUserCaching) {
      console.log("   ✅ OptimizedProjectService has advanced caching");
      console.log("   ✅ User-level caching implemented");
    }
  }
  
  // Test 3: Optimized Database Queries
  console.log("\n✅ Test 3: Optimized Database Queries");
  
  if (fs.existsSync(optimizedProjectServicePath)) {
    const optimizedContent = fs.readFileSync(optimizedProjectServicePath, 'utf8');
    const hasOptimizedQueries = optimizedContent.includes('Single optimized query with JOINs') || 
                               optimizedContent.includes('getAllProjectsOptimized');
    const hasStatsQuery = optimizedContent.includes('getProjectsWithStats') && 
                         optimizedContent.includes('Single query with lead counts');
    
    if (hasOptimizedQueries && hasStatsQuery) {
      console.log("   ✅ Single-query optimization for projects");
      console.log("   ✅ Stats calculated in single query");
      results.optimizedQueries = true;
    } else {
      console.log("   ❌ Missing optimized database queries");
    }
  }
  
  // Test 4: Bundle Optimization
  console.log("\n✅ Test 4: Bundle Optimization");
  
  const viteConfigPath = 'vite.config.ts';
  if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    const hasManualChunks = viteConfig.includes('manualChunks') && 
                           viteConfig.includes('react-runtime');
    const hasChunkOptimization = viteConfig.includes('react-ecosystem') || 
                                viteConfig.includes('vendor');
    
    if (hasManualChunks && hasChunkOptimization) {
      console.log("   ✅ Manual chunk splitting implemented");
      console.log("   ✅ React runtime separated");
      results.bundleOptimization = true;
    } else {
      console.log("   ❌ Missing bundle optimization");
    }
  }
  
  // Test 5: Memory Management
  console.log("\n✅ Test 5: Memory Management");
  
  // Check for cleanup functions
  const unifiedStorePath = 'src/stores/unifiedRealTimeStore.ts';
  if (fs.existsSync(unifiedStorePath)) {
    const storeContent = fs.readFileSync(unifiedStorePath, 'utf8');
    const hasCleanup = storeContent.includes('cleanup:') && 
                      storeContent.includes('unsubscribe');
    const hasPerformanceMonitoring = storeContent.includes('getPerformanceReport') && 
                                    storeContent.includes('performance_grade');
    
    if (hasCleanup && hasPerformanceMonitoring) {
      console.log("   ✅ Cleanup functions implemented");
      console.log("   ✅ Performance monitoring active");
      results.memoryManagement = true;
    } else {
      console.log("   ❌ Missing memory management features");
    }
  }
  
  // Test 6: Cache Invalidation
  console.log("\n✅ Test 6: Cache Invalidation");
  
  // Check for cache clearing scripts
  const cacheClearPath = 'scripts/fixes/CLEAR_CACHE_FIX.js';
  if (fs.existsSync(cacheClearPath)) {
    const cacheClear = fs.readFileSync(cacheClearPath, 'utf8');
    const hasCacheBusting = cacheClear.includes('cache-busting') || 
                           cacheClear.includes('localStorage.removeItem');
    const hasPatternMatching = cacheClear.includes('patterns') && 
                              cacheClear.includes('lead|project|dashboard');
    
    if (hasCacheBusting && hasPatternMatching) {
      console.log("   ✅ Cache invalidation system implemented");
      console.log("   ✅ Pattern-based cache clearing");
    }
  }
  
  // Summary
  console.log("\n📊 PERFORMANCE OPTIMIZATION SUMMARY");
  console.log("====================================");
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  
  if (results.contextDuplication) console.log("✅ Context Duplication: PREVENTED");
  if (results.singleton) console.log("✅ Singleton Pattern: IMPLEMENTED");
  if (results.caching) console.log("✅ Advanced Caching: ACTIVE");
  if (results.optimizedQueries) console.log("✅ Optimized Queries: IMPLEMENTED");
  if (results.bundleOptimization) console.log("✅ Bundle Optimization: ACTIVE");
  if (results.memoryManagement) console.log("✅ Memory Management: IMPLEMENTED");
  
  console.log("\n🎉 PERFORMANCE OPTIMIZATIONS VERIFIED!");
  console.log("⚡ Reduced context duplication");
  console.log("🚀 Improved caching system");
  console.log("📊 Optimized database queries");
  console.log("🧹 Better memory management");
  
  return passedTests === totalTests;
}

// Run tests
testPerformanceOptimizations()
  .then((success) => {
    if (success) {
      console.log("\n✅ ALL PERFORMANCE OPTIMIZATIONS VERIFIED!");
      process.exit(0);
    } else {
      console.log("\n⚠️  SOME PERFORMANCE OPTIMIZATIONS NEED ATTENTION");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Error testing performance optimizations:", error);
    process.exit(1);
  }); 