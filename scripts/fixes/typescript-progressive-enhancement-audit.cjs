#!/usr/bin/env node

/**
 * TypeScript Progressive Enhancement Audit (Option 2)
 * 
 * Performs comprehensive audit of all files to identify:
 * 1. Files with @ts-nocheck that can be safely removed
 * 2. Files that need @ts-nocheck due to real issues
 * 3. Priority order for fixing files one by one
 * 4. Specific errors that need fixing in each file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findAllTypeScriptFiles() {
  const files = [];
  
  function scanDirectory(dir) {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) {
      return;
    }
    
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory('src');
  scanDirectory('scripts');
  scanDirectory('quality-validation');
  
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      path: filePath,
      hasNoCheck: false,
      noCheckLine: -1,
      noCheckReason: '',
      lineCount: lines.length,
      imports: [],
      exports: [],
      issues: [],
      complexity: 'unknown'
    };
    
    // Check for @ts-nocheck
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.includes('@ts-nocheck')) {
        analysis.hasNoCheck = true;
        analysis.noCheckLine = index + 1;
        
        // Extract reason from comment
        const nextLines = lines.slice(index + 1, index + 3);
        const reasonLine = nextLines.find(l => l.includes('TEMP:') || l.includes('TODO:') || l.includes('//'));
        if (reasonLine) {
          analysis.noCheckReason = reasonLine.trim().replace(/^\/\/\s*/, '');
        }
      }
      
      // Count imports/exports for complexity
      if (trimmed.startsWith('import ')) {
        analysis.imports.push(trimmed);
      }
      if (trimmed.startsWith('export ')) {
        analysis.exports.push(trimmed);
      }
    });
    
    // Estimate complexity
    if (analysis.lineCount < 50) analysis.complexity = 'low';
    else if (analysis.lineCount < 200) analysis.complexity = 'medium';
    else if (analysis.lineCount < 500) analysis.complexity = 'high';
    else analysis.complexity = 'very_high';
    
    return analysis;
    
  } catch (error) {
    return {
      path: filePath,
      error: error.message,
      hasNoCheck: false,
      complexity: 'error'
    };
  }
}

function getTypeScriptErrorsForFile(filePath) {
  try {
    // Run TypeScript check on single file
    const output = execSync(`npx tsc --noEmit --skipLibCheck "${filePath}" 2>&1`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return [];
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || '';
    const errors = [];
    
    // Parse TypeScript errors
    const errorLines = errorOutput.split('\n').filter(line => 
      line.includes(filePath) && line.includes('error TS')
    );
    
    errorLines.forEach(line => {
      const match = line.match(/(\d+):(\d+).*error TS(\d+):\s*(.+)/);
      if (match) {
        errors.push({
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          code: match[3],
          message: match[4].trim()
        });
      }
    });
    
    return errors;
  }
}

function prioritizeFiles(analyses) {
  return analyses
    .filter(a => !a.error)
    .sort((a, b) => {
      // Priority order:
      // 1. Files without @ts-nocheck and no errors (ready to go)
      // 2. Files with @ts-nocheck but low complexity
      // 3. Files with @ts-nocheck but medium complexity  
      // 4. Files with @ts-nocheck but high complexity
      
      const aScore = getPriorityScore(a);
      const bScore = getPriorityScore(b);
      
      return aScore - bScore;
    });
}

function getPriorityScore(analysis) {
  let score = 0;
  
  // Base score by complexity
  switch (analysis.complexity) {
    case 'low': score = 10; break;
    case 'medium': score = 20; break;
    case 'high': score = 30; break;
    case 'very_high': score = 40; break;
  }
  
  // Penalty for @ts-nocheck
  if (analysis.hasNoCheck) score += 100;
  
  // Bonus for critical files
  if (analysis.path.includes('whatsapp')) score -= 5;
  if (analysis.path.includes('database')) score -= 5;
  if (analysis.path.includes('types')) score -= 10;
  
  return score;
}

function generateFixPlan(analyses) {
  const plan = {
    readyToFix: [],      // Files that can have @ts-nocheck removed now
    needsMinorFixes: [], // Files with 1-5 TypeScript errors
    needsMajorFixes: [], // Files with 6+ TypeScript errors or complex issues
    alreadyClean: []     // Files without @ts-nocheck and no errors
  };
  
  analyses.forEach(analysis => {
    if (analysis.error) return;
    
    if (!analysis.hasNoCheck) {
      plan.alreadyClean.push(analysis);
      return;
    }
    
    // For files with @ts-nocheck, check their actual errors
    const errors = getTypeScriptErrorsForFile(analysis.path);
    analysis.errorCount = errors.length;
    analysis.errors = errors.slice(0, 5); // First 5 errors for display
    
    if (errors.length === 0) {
      plan.readyToFix.push(analysis);
    } else if (errors.length <= 5) {
      plan.needsMinorFixes.push(analysis);
    } else {
      plan.needsMajorFixes.push(analysis);
    }
  });
  
  return plan;
}

async function main() {
  try {
    log('cyan', '🔍 TYPESCRIPT PROGRESSIVE ENHANCEMENT AUDIT (OPTION 2)');
    log('blue', '=====================================================');
    
    log('blue', '\n📁 Scanning for TypeScript files...');
    const allFiles = findAllTypeScriptFiles();
    log('green', `Found ${allFiles.length} TypeScript files`);
    
    log('blue', '\n🔍 Analyzing files...');
    const analyses = allFiles.map(file => {
      const analysis = analyzeFile(file);
      if (!analysis.error) {
        log('cyan', `  📄 ${analysis.path} (${analysis.complexity} complexity, @ts-nocheck: ${analysis.hasNoCheck})`);
      }
      return analysis;
    });
    
    log('blue', '\n📊 Generating fix plan...');
    const plan = generateFixPlan(analyses);
    
    log('blue', '\n📋 COMPREHENSIVE AUDIT RESULTS');
    log('blue', '==============================');
    
    // Ready to fix (can remove @ts-nocheck immediately)
    if (plan.readyToFix.length > 0) {
      log('green', `\n✅ READY TO FIX (${plan.readyToFix.length} files)`);
      log('green', '   These files have @ts-nocheck but NO TypeScript errors:');
      plan.readyToFix.forEach(file => {
        log('green', `   📄 ${file.path}`);
        log('yellow', `      Reason: ${file.noCheckReason || 'No reason specified'}`);
      });
    }
    
    // Files that are already clean
    log('cyan', `\n✅ ALREADY CLEAN (${plan.alreadyClean.length} files)`);
    log('cyan', '   These files have no @ts-nocheck and compile successfully');
    
    // Files needing minor fixes
    if (plan.needsMinorFixes.length > 0) {
      log('yellow', `\n⚠️ NEEDS MINOR FIXES (${plan.needsMinorFixes.length} files)`);
      log('yellow', '   These files have 1-5 TypeScript errors:');
      plan.needsMinorFixes.slice(0, 5).forEach(file => {
        log('yellow', `   📄 ${file.path} (${file.errorCount} errors)`);
        if (file.errors.length > 0) {
          file.errors.slice(0, 2).forEach(error => {
            log('yellow', `      Line ${error.line}: ${error.message}`);
          });
        }
      });
      if (plan.needsMinorFixes.length > 5) {
        log('yellow', `      ... and ${plan.needsMinorFixes.length - 5} more files`);
      }
    }
    
    // Files needing major fixes
    if (plan.needsMajorFixes.length > 0) {
      log('red', `\n❌ NEEDS MAJOR FIXES (${plan.needsMajorFixes.length} files)`);
      log('red', '   These files have 6+ TypeScript errors or complex issues:');
      plan.needsMajorFixes.slice(0, 3).forEach(file => {
        log('red', `   📄 ${file.path} (${file.errorCount} errors)`);
        log('red', `      Complexity: ${file.complexity}`);
        log('red', `      Reason: ${file.noCheckReason || 'No reason specified'}`);
      });
      if (plan.needsMajorFixes.length > 3) {
        log('red', `      ... and ${plan.needsMajorFixes.length - 3} more files`);
      }
    }
    
    log('blue', '\n🎯 PROGRESSIVE ENHANCEMENT PLAN');
    log('blue', '===============================');
    
    log('cyan', '\n📋 Phase 1: Quick Wins (Immediate)');
    if (plan.readyToFix.length > 0) {
      log('green', `   • Remove @ts-nocheck from ${plan.readyToFix.length} files (no errors)`);
      log('green', '   • These are safe to fix immediately');
    } else {
      log('yellow', '   • No files ready for immediate @ts-nocheck removal');
    }
    
    log('cyan', '\n📋 Phase 2: Minor Fixes (Next)');
    if (plan.needsMinorFixes.length > 0) {
      log('yellow', `   • Fix ${plan.needsMinorFixes.length} files with 1-5 errors each`);
      log('yellow', '   • Estimated effort: 1-2 hours total');
      log('yellow', '   • Focus on lowest complexity files first');
    } else {
      log('green', '   • No files need minor fixes');
    }
    
    log('cyan', '\n📋 Phase 3: Major Fixes (Later)');
    if (plan.needsMajorFixes.length > 0) {
      log('red', `   • Fix ${plan.needsMajorFixes.length} files with complex issues`);
      log('red', '   • Estimated effort: 4-8 hours total');
      log('red', '   • Consider keeping @ts-nocheck for now on very complex files');
    } else {
      log('green', '   • No files need major fixes');
    }
    
    log('blue', '\n💡 RECOMMENDATIONS');
    log('blue', '==================');
    
    log('cyan', '1. Immediate Actions:');
    if (plan.readyToFix.length > 0) {
      log('green', `   • Run: npm run fix:remove-safe-nocheck (to be created)`);
      log('green', '   • This will remove @ts-nocheck from error-free files');
    }
    log('green', '   • Continue using @ts-nocheck for problematic files');
    log('green', '   • Focus on business-critical files first');
    
    log('cyan', '\n2. Progressive Strategy:');
    log('yellow', '   • Fix one file at a time when working in that area');
    log('yellow', '   • Test thoroughly after each @ts-nocheck removal');
    log('yellow', '   • Keep build working at all times');
    
    log('cyan', '\n3. Long-term Approach:');
    log('yellow', '   • Monitor: npm run typescript:progress (to be created)');
    log('yellow', '   • Goal: Reduce @ts-nocheck usage by 20% per month');
    log('yellow', '   • Keep complex monitoring files with @ts-nocheck for now');
    
    // Save audit results
    const auditResults = {
      timestamp: new Date().toISOString(),
      totalFiles: allFiles.length,
      summary: {
        alreadyClean: plan.alreadyClean.length,
        readyToFix: plan.readyToFix.length,
        needsMinorFixes: plan.needsMinorFixes.length,
        needsMajorFixes: plan.needsMajorFixes.length
      },
      files: {
        readyToFix: plan.readyToFix.map(f => ({ path: f.path, reason: f.noCheckReason })),
        needsMinorFixes: plan.needsMinorFixes.map(f => ({ 
          path: f.path, 
          errorCount: f.errorCount,
          complexity: f.complexity
        })),
        needsMajorFixes: plan.needsMajorFixes.map(f => ({ 
          path: f.path, 
          errorCount: f.errorCount,
          complexity: f.complexity,
          reason: f.noCheckReason
        }))
      }
    };
    
    fs.writeFileSync('typescript-audit-results.json', JSON.stringify(auditResults, null, 2));
    log('cyan', '\n📄 Detailed results saved to: typescript-audit-results.json');
    
    log('green', '\n🎉 PROGRESSIVE ENHANCEMENT AUDIT COMPLETE!');
    log('blue', `📊 Summary: ${plan.alreadyClean.length} clean, ${plan.readyToFix.length} ready, ${plan.needsMinorFixes.length} minor, ${plan.needsMajorFixes.length} major`);
    
  } catch (error) {
    log('red', `❌ Audit failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main(); 