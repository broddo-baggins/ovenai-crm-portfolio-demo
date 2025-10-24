#!/usr/bin/env node

/**
 * Safe @ts-nocheck Removal Script
 * 
 * Removes @ts-nocheck from files that have no TypeScript errors (Option 2 implementation)
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function hasTypeScriptErrors(filePath) {
  try {
    execSync(`npx tsc --noEmit --skipLibCheck "${filePath}"`, { 
      stdio: 'pipe'
    });
    return false; // No errors
  } catch (error) {
    return true; // Has errors
  }
}

function removeNoCheck(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove @ts-nocheck and related comments
    content = content.replace(/\/\/ @ts-nocheck\s*\n/, '');
    content = content.replace(/\/\/ TEMP:.*?\n/, '');
    content = content.replace(/\/\/ TODO:.*?\n/, '');
    content = content.replace(/\/\/ TypeScript.*?\n/, '');
    
    // Remove extra blank lines that might be left
    content = content.replace(/\n\n\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    log('red', `❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    log('cyan', '🧹 SAFE @TS-NOCHECK REMOVAL (OPTION 2)');
    log('blue', '=====================================');
    
    // Load audit results
    if (!fs.existsSync('typescript-audit-results.json')) {
      log('red', '❌ Audit results not found. Run the audit first.');
      process.exit(1);
    }
    
    const auditResults = JSON.parse(fs.readFileSync('typescript-audit-results.json', 'utf8'));
    const readyToFix = auditResults.files.readyToFix;
    
    log('blue', `\n📋 Found ${readyToFix.length} files ready for @ts-nocheck removal`);
    
    let processed = 0;
    let removed = 0;
    let skipped = 0;
    let errors = 0;
    
    log('blue', '\n🔍 Verifying files and removing @ts-nocheck...');
    
    for (const fileInfo of readyToFix) {
      const filePath = fileInfo.path;
      processed++;
      
      log('cyan', `\n[${processed}/${readyToFix.length}] Processing: ${filePath}`);
      
      // Double-check that file has no TypeScript errors
      if (hasTypeScriptErrors(filePath)) {
        log('yellow', `  ⚠️ Skipped: File now has TypeScript errors`);
        skipped++;
        continue;
      }
      
      // Remove @ts-nocheck
      if (removeNoCheck(filePath)) {
        log('green', `  ✅ Removed @ts-nocheck successfully`);
        removed++;
        
        // Verify the file still compiles after removal
        if (hasTypeScriptErrors(filePath)) {
          log('red', `  ❌ ERROR: File has errors after @ts-nocheck removal!`);
          log('yellow', `  🔄 Reverting changes...`);
          
          // Revert the change
          execSync(`git checkout -- "${filePath}"`, { stdio: 'pipe' });
          errors++;
          removed--;
        } else {
          log('green', `  ✅ Verified: File compiles correctly without @ts-nocheck`);
        }
      } else {
        log('yellow', `  ⚠️ No @ts-nocheck found to remove`);
        skipped++;
      }
    }
    
    log('blue', '\n📊 REMOVAL SUMMARY');
    log('blue', '==================');
    log('cyan', `Files processed: ${processed}`);
    log('green', `@ts-nocheck removed: ${removed}`);
    log('yellow', `Files skipped: ${skipped}`);
    log('red', `Errors encountered: ${errors}`);
    
    if (removed > 0) {
      log('green', '\n🎉 SUCCESS! Files cleaned:');
      log('green', `✅ ${removed} files no longer have @ts-nocheck`);
      log('green', '✅ All files verified to compile correctly');
      log('green', '✅ Build should still work');
      
      log('blue', '\n📋 Next Steps:');
      log('yellow', '1. Test build: npm run build:clean');
      log('yellow', '2. Run tests: npm run test:complete'); 
      log('yellow', '3. Commit changes if all tests pass');
      log('yellow', '4. Continue with remaining files when working in those areas');
    }
    
    if (skipped > 0 || errors > 0) {
      log('yellow', '\n⚠️ Some files were skipped or had issues:');
      if (skipped > 0) {
        log('yellow', `• ${skipped} files skipped (now have TypeScript errors)`);
      }
      if (errors > 0) {
        log('red', `• ${errors} files caused errors after @ts-nocheck removal`);
      }
      log('yellow', '• These files will keep @ts-nocheck for now');
      log('yellow', '• Fix them individually when working in those areas');
    }
    
    // Update progress tracking
    const progress = {
      timestamp: new Date().toISOString(),
      totalFiles: auditResults.totalFiles,
      cleanFiles: auditResults.summary.alreadyClean + removed,
      filesWithNoCheck: auditResults.files.readyToFix.length + 
                        auditResults.files.needsMinorFixes.length + 
                        auditResults.files.needsMajorFixes.length - removed,
      progressPercentage: ((auditResults.summary.alreadyClean + removed) / auditResults.totalFiles * 100).toFixed(1)
    };
    
    fs.writeFileSync('typescript-progress.json', JSON.stringify(progress, null, 2));
    
    log('cyan', `\n📈 TypeScript Progress: ${progress.progressPercentage}% files clean`);
    log('cyan', `📄 Progress saved to: typescript-progress.json`);
    
  } catch (error) {
    log('red', `❌ Safe removal failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main(); 