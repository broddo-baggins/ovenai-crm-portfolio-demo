#!/usr/bin/env node

/**
 * Remove Temporary Placeholders
 * 
 * Cleans up temporary placeholders and comments from the TypeScript fix process
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

function removeTemporaryPlaceholders(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;

  // Pattern 1: Remove temporary placeholder variables
  const placeholderPattern = /\s*const (data|webhooks|templates|rateLimits|messages) = \[\]; \/\/ Temporary placeholder\n/g;
  const beforePlaceholders = content;
  content = content.replace(placeholderPattern, '');
  if (content !== beforePlaceholders) {
    changesMade++;
    log('green', `  ✅ Removed temporary placeholder variables`);
  }

  // Pattern 2: Clean up commented database calls (if we're ready to re-enable them)
  // For now, we'll keep them commented but clean up the formatting

  // Pattern 3: Remove excessive TEMP comments
  const tempCommentPattern = /\s*\/\/ TEMP:.*?(table access|disabled|fixed).*?\n/g;
  const beforeTempComments = content;
  content = content.replace(tempCommentPattern, '');
  if (content !== beforeTempComments) {
    changesMade++;
    log('green', `  ✅ Cleaned up temporary comments`);
  }

  // Pattern 4: Update @ts-nocheck comments to be more specific
  content = content.replace(
    /\/\/ @ts-nocheck\s*\n\/\/ TEMP:.*?\n\/\/ TODO:.*?\n/,
    `// @ts-nocheck
// Database table access partially restored - remove when fully operational
`
  );

  if (changesMade > 0) {
    fs.writeFileSync(filePath, content);
    log('cyan', `📝 Cleaned up ${filePath}`);
  } else {
    log('yellow', `⚠️ No cleanup needed in ${filePath}`);
  }

  return changesMade;
}

function cleanupScriptFiles() {
  // Optional: Clean up temporary scripts if they're no longer needed
  const tempScripts = [
    'scripts/fixes/fix-all-syntax-errors.cjs',
    'scripts/fixes/fix-hanging-assignments.cjs',
    'scripts/fixes/emergency-build-fix.cjs'
  ];

  let movedCount = 0;
  const archiveDir = 'scripts/fixes/archive';
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  tempScripts.forEach(script => {
    if (fs.existsSync(script)) {
      const filename = script.split('/').pop();
      const archivePath = `${archiveDir}/${filename}`;
      
      // Add a note to the top of the archived script
      let content = fs.readFileSync(script, 'utf8');
      content = `// ARCHIVED: ${new Date().toISOString()}
// This script was part of the TypeScript fix process and is kept for reference
${content}`;
      
      fs.writeFileSync(archivePath, content);
      fs.unlinkSync(script);
      movedCount++;
      log('green', `📦 Archived: ${script} → ${archivePath}`);
    }
  });

  return movedCount;
}

async function main() {
  try {
    log('cyan', '🧹 REMOVING TEMPORARY PLACEHOLDERS');
    log('blue', '===================================');

    const whatsappFiles = [
      'src/services/whatsapp-logging.ts',
      'src/services/whatsapp-monitoring.ts',
      'src/services/whatsapp-alert-service.ts',
      'src/services/whatsapp-uptime-monitoring.ts'
    ];

    let totalChanges = 0;

    log('blue', '\n1. Cleaning up WhatsApp service files...');
    whatsappFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log('blue', `\nCleaning: ${file}`);
        totalChanges += removeTemporaryPlaceholders(file);
      }
    });

    log('blue', '\n2. Archiving temporary scripts...');
    const archivedCount = cleanupScriptFiles();
    totalChanges += archivedCount;

    log('blue', '\n3. Cleanup recommendations...');
    log('yellow', '⚠️ Manual cleanup needed:');
    log('yellow', '   • Remove @ts-nocheck from fully working files');
    log('yellow', '   • Uncomment remaining database table access');
    log('yellow', '   • Test all WhatsApp logging functionality');

    log('green', `\n🎉 Cleanup complete! Made ${totalChanges} changes.`);
    
    log('blue', '\n📋 Next steps:');
    log('yellow', '1. Test: npm run test:complete');
    log('yellow', '2. Verify: npm run build:clean');
    log('yellow', '3. Test WhatsApp logging functionality');
    log('yellow', '4. Remove @ts-nocheck when ready');

  } catch (error) {
    log('red', `❌ Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

main(); 