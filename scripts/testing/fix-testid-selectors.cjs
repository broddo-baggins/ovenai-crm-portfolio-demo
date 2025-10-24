#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix testid selector mismatches across the test suite
 * This updates old testids to match the current app design
 */

const TESTID_FIXES = {
  '[data-testid="email"]': '[data-testid="email-input"]',
  '[data-testid="password"]': '[data-testid="password-input"]',
  'data-testid="email"': 'data-testid="email-input"',
  'data-testid="password"': 'data-testid="password-input"'
};

function fixTestIdsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldPattern, newPattern] of Object.entries(TESTID_FIXES)) {
    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
      changed = true;
      console.log(`✅ Fixed ${oldPattern} → ${newPattern} in ${filePath}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function findAndFixTestFiles(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalFixed += findAndFixTestFiles(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      if (fixTestIdsInFile(fullPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

console.log('🔧 Starting testid selector fixes...');
const testsDir = path.join(process.cwd(), 'tests');
const fixedFiles = findAndFixTestFiles(testsDir);
console.log(`\n🎉 Fixed testid selectors in ${fixedFiles} files`); 