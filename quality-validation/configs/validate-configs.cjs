#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Tests that all test configurations load without errors
 */

console.log('🧪 Validating Test Configurations...\n');

const configs = [
  {
    name: 'Main Playwright Config',
    file: './playwright.config.ts',
    type: 'playwright'
  },
  {
    name: 'Admin Playwright Config', 
    file: './playwright.config.admin.ts',
    type: 'playwright'
  },
  {
    name: 'Mobile Playwright Config',
    file: './playwright.mobile.config.ts', 
    type: 'playwright'
  },
  {
    name: 'Queue Playwright Config',
    file: './playwright.queue.config.ts',
    type: 'playwright'
  },
  {
    name: 'Vitest Config',
    file: './vitest.config.ts',
    type: 'vitest'
  }
];

let allValid = true;
let validCount = 0;

for (const config of configs) {
  try {
    console.log(`📋 Testing: ${config.name}`);
    
    // Try to require/import the config
    const configModule = require(config.file);
    
    if (configModule && typeof configModule === 'object') {
      console.log(`✅ ${config.name} - Config loaded successfully`);
      
      // Basic validation for Playwright configs
      if (config.type === 'playwright') {
        if (configModule.default) {
          const cfg = configModule.default;
          if (cfg.testDir) {
            console.log(`   📁 Test Directory: ${cfg.testDir}`);
          }
          if (cfg.reporter) {
            console.log(`   📊 Reporter: ${Array.isArray(cfg.reporter) ? cfg.reporter.map(r => Array.isArray(r) ? r[0] : r).join(', ') : cfg.reporter}`);
          }
          if (cfg.projects) {
            console.log(`   🖥️  Projects: ${cfg.projects.length} browser(s)`);
          }
          if (cfg.workers) {
            const workers = typeof cfg.workers === 'function' ? 'dynamic' : cfg.workers;
            console.log(`   👥 Workers: ${workers}`);
          }
        }
      }
      
      // Basic validation for Vitest configs
      if (config.type === 'vitest') {
        if (configModule.default && configModule.default.test) {
          const testConfig = configModule.default.test;
          console.log(`   🧪 Environment: ${testConfig.environment || 'node'}`);
          if (testConfig.include) {
            console.log(`   📝 Includes: ${testConfig.include.length} pattern(s)`);
          }
          if (testConfig.exclude) {
            console.log(`   ❌ Excludes: ${testConfig.exclude.length} pattern(s)`);
          }
        }
      }
      
      validCount++;
      console.log('');
    } else {
      console.log(`❌ ${config.name} - Invalid config structure`);
      allValid = false;
    }
    
  } catch (error) {
    console.log(`❌ ${config.name} - Error loading config:`);
    console.log(`   ${error.message}`);
    allValid = false;
  }
}

console.log('\n📊 Validation Summary:');
console.log(`   Valid Configs: ${validCount}/${configs.length}`);
console.log(`   Status: ${allValid ? '✅ ALL CONFIGS VALID' : '❌ SOME CONFIGS INVALID'}`);

if (allValid) {
  console.log('\n🎯 Configuration Test Commands:');
  console.log('   # Sanity tests');
  console.log('   npx playwright test quality-validation/tests/sanity/ --config=quality-validation/configs/playwright.config.ts --reporter=list');
  console.log('');
  console.log('   # Admin tests'); 
  console.log('   npx playwright test --config=quality-validation/configs/playwright.config.admin.ts --reporter=list');
  console.log('');
  console.log('   # Mobile tests');
  console.log('   npx playwright test --config=quality-validation/configs/playwright.mobile.config.ts --reporter=list');
  console.log('');
  console.log('   # Queue tests');
  console.log('   npx playwright test --config=quality-validation/configs/playwright.queue.config.ts --reporter=list');
  console.log('');
  console.log('   # Unit tests');
  console.log('   npx vitest --config=quality-validation/configs/vitest.config.ts --run');
}

process.exit(allValid ? 0 : 1); 