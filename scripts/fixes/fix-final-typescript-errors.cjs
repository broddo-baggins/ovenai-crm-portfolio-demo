#!/usr/bin/env node

/**
 * Fix Final 11 TypeScript Errors
 * 
 * All remaining errors are "Expression expected" - incomplete commenting syntax
 */

const fs = require('fs');

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

function fixSyntaxInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changesMade = 0;

  // Pattern: Look for hanging method calls after commented supabase calls
  const fixedLines = lines.map((line, index) => {
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)[1];

    // Pattern 1: Hanging .insert, .select, etc (starts with dot)
    if (trimmed.match(/^\.(insert|select|update|delete|upsert|from)\(/)) {
      changesMade++;
      return indent + '// ' + trimmed;
    }

    // Pattern 2: Hanging closing brackets/parentheses after commented calls
    if (trimmed.match(/^[\)\}];?$/) && index > 0) {
      const prevLine = lines[index - 1];
      if (prevLine.includes('// await supabase') || prevLine.includes('// .')) {
        changesMade++;
        return indent + '// ' + trimmed;
      }
    }

    // Pattern 3: Object properties after commented calls
    if (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) && index > 0) {
      const prevLine = lines[index - 1];
      if (prevLine.includes('// await supabase') || prevLine.includes('// .')) {
        changesMade++;
        return indent + '// ' + trimmed;
      }
    }

    return line;
  });

  if (changesMade > 0) {
    fs.writeFileSync(filePath, fixedLines.join('\n'));
    log('green', `✅ Fixed ${changesMade} syntax errors in ${filePath}`);
  } else {
    log('yellow', `⚠️ No syntax errors found in ${filePath}`);
  }

  return changesMade;
}

async function main() {
  try {
    log('cyan', '🔧 FIXING FINAL 11 TYPESCRIPT ERRORS');
    log('blue', '====================================');

    const errorFiles = [
      'src/services/whatsapp-alert-service.ts',
      'src/services/whatsapp-monitoring.ts', 
      'src/services/whatsapp-uptime-monitoring.ts'
    ];

    let totalFixes = 0;

    errorFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log('blue', `\nFixing: ${file}`);
        totalFixes += fixSyntaxInFile(file);
      } else {
        log('red', `❌ File not found: ${file}`);
      }
    });

    log('green', `\n🎉 Fixed ${totalFixes} syntax errors!`);
    
    log('blue', '\n📋 Next steps:');
    log('yellow', '1. Verify: npm run type-check (should show 0 errors)');
    log('yellow', '2. Test: npm run build:clean');
    log('yellow', '3. Re-enable table access');

  } catch (error) {
    log('red', `❌ Fix failed: ${error.message}`);
    process.exit(1);
  }
}

main(); 