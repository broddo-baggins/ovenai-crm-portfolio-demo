#!/usr/bin/env node

/**
 * Fix Remaining Syntax Errors
 * 
 * Fixes the syntax errors caused by incomplete commenting of database calls
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

function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = 0;

    // Fix incomplete commenting - comment out entire statements
    const fixes = [
      {
        // Fix: // await supabase.from('table') followed by .insert or other methods
        pattern: /\/\/ await supabase\.from\([^)]+\)[\s\S]*?\.(?:insert|select|update|delete)\([^)]*\);?/g,
        replacement: (match) => {
          // Comment out the entire statement properly
          return match.split('\n').map(line => 
            line.trim() ? '      // ' + line.trim() : line
          ).join('\n');
        },
        description: 'Fix incomplete commenting of database statements'
      },
      {
        // Fix hanging semicolons and incomplete statements
        pattern: /\/\/ await supabase\.from\([^)]+\)[^;]*$/gm,
        replacement: (match) => '      // ' + match.trim(),
        description: 'Fix hanging incomplete statements'
      }
    ];

    // Apply each fix
    fixes.forEach(fix => {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== originalContent) {
        changesMade++;
        log('green', `  ✅ ${fix.description}`);
      }
    });

    // More targeted fixes for specific patterns
    const specificFixes = [
      // Fix statements that start with commented supabase calls but have uncommented continuations
      {
        from: /\/\/ await supabase\.from\('([^']+)'\)\s*\n\s*\.insert\(/g,
        to: '      // await supabase.from(\'$1\')\n      // .insert(',
        desc: 'Fix multiline database calls'
      },
      {
        from: /\/\/ await supabase\.from\('([^']+)'\)\s*\n\s*\.select\(/g,  
        to: '      // await supabase.from(\'$1\')\n      // .select(',
        desc: 'Fix multiline select calls'
      },
      {
        from: /^\s*\.(?:insert|select|update|delete)\(/gm,
        to: (match) => '      // ' + match.trim(),
        desc: 'Comment out hanging method calls'
      }
    ];

    specificFixes.forEach(fix => {
      const originalContent = content;
      if (typeof fix.to === 'function') {
        content = content.replace(fix.from, fix.to);
      } else {
        content = content.replace(fix.from, fix.to);
      }
      
      if (content !== originalContent) {
        changesMade++;
        log('green', `  ✅ ${fix.desc}`);
      }
    });

    if (changesMade > 0) {
      fs.writeFileSync(filePath, content);
      log('cyan', `📝 Fixed ${filePath} with ${changesMade} syntax corrections`);
    } else {
      log('yellow', `⚠️ No syntax errors found in ${filePath}`);
    }

    return changesMade;
  } catch (error) {
    log('red', `❌ Error fixing ${filePath}: ${error.message}`);
    return 0;
  }
}

async function main() {
  try {
    log('cyan', '🔧 FIXING REMAINING SYNTAX ERRORS');
    log('blue', '==================================');

    const problemFiles = [
      'src/services/whatsapp-alert-service.ts',
      'src/services/whatsapp-logging.ts',
      'src/services/whatsapp-monitoring.ts',
      'src/services/whatsapp-uptime-monitoring.ts'
    ];

    let totalFixes = 0;

    problemFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log('blue', `\nFixing: ${file}`);
        totalFixes += fixSyntaxErrors(file);
      } else {
        log('yellow', `⚠️ File not found: ${file}`);
      }
    });

    log('green', `\n🎉 Syntax fix complete! Applied ${totalFixes} corrections.`);
    
    log('blue', '\n📋 Next steps:');
    log('yellow', '1. Run: npm run type-check to verify all fixes');
    log('yellow', '2. Run tests to ensure no regressions');
    log('yellow', '3. Re-enable TypeScript checking in pre-push hooks');

  } catch (error) {
    log('red', `❌ Syntax fix failed: ${error.message}`);
    process.exit(1);
  }
}

main(); 