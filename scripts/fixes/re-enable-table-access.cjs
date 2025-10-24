#!/usr/bin/env node

/**
 * Re-enable Table Access for WhatsApp Services
 * 
 * Removes temporary placeholders and restores proper database calls
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

function reEnableTableAccess(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;

  // Pattern 1: Restore whatsapp_message_queue access
  const whatsappQueuePattern = /\/\/ TEMP:.*?\n(\s*)\/\/ await supabase\.from\('whatsapp_message_queue'\)\n((\s*\/\/[^\n]*\n)*)/g;
  content = content.replace(whatsappQueuePattern, (match, indent) => {
    changesMade++;
    return `${indent}await supabase.from('whatsapp_message_queue')\n`;
  });

  // Pattern 2: Remove temporary placeholders
  content = content.replace(/const (data|webhooks|templates|rateLimits|messages) = \[\]; \/\/ Temporary placeholder\n/g, '');

  // Pattern 3: Restore conversation_audit_log access (but keep commented for now)
  // We'll leave this commented until table access is confirmed working

  // Pattern 4: Restore dashboard_system_metrics access (but keep commented for now)
  // We'll leave this commented until table access is confirmed working

  // Pattern 5: Restore agent_interaction_logs access (but keep commented for now)
  // We'll leave this commented until table access is confirmed working

  if (changesMade > 0) {
    fs.writeFileSync(filePath, content);
    log('green', `✅ Re-enabled ${changesMade} table access calls in ${filePath}`);
  } else {
    log('yellow', `⚠️ No table access to re-enable in ${filePath}`);
  }

  return changesMade;
}

function updateTsNoCheckComments(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update @ts-nocheck comment to reflect current status
  content = content.replace(
    /\/\/ @ts-nocheck\s*\n\/\/ TEMP:.*?\n\/\/ TODO:.*?\n/,
    `// @ts-nocheck
// TEMP: TypeScript disabled - table access partially restored
// TODO: Remove after confirming all database table access works
`
  );

  fs.writeFileSync(filePath, content);
  log('cyan', `📝 Updated @ts-nocheck comment in ${filePath}`);
}

async function main() {
  try {
    log('cyan', '🔄 RE-ENABLING TABLE ACCESS FOR WHATSAPP SERVICES');
    log('blue', '=================================================');

    const whatsappFiles = [
      'src/services/whatsapp-logging.ts',
      'src/services/whatsapp-monitoring.ts',
      'src/services/whatsapp-alert-service.ts',
      'src/services/whatsapp-uptime-monitoring.ts'
    ];

    let totalChanges = 0;

    log('blue', '\n1. Re-enabling safe table access...');
    whatsappFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log('blue', `\nProcessing: ${file}`);
        totalChanges += reEnableTableAccess(file);
        updateTsNoCheckComments(file);
      } else {
        log('red', `❌ File not found: ${file}`);
      }
    });

    log('blue', '\n2. Validation recommendations...');
    log('yellow', '⚠️ Tables left commented for safety:');
    log('yellow', '   • conversation_audit_log - uncomment after RLS verification');
    log('yellow', '   • dashboard_system_metrics - uncomment after table creation');
    log('yellow', '   • agent_interaction_logs - uncomment after schema sync');

    log('green', `\n🎉 Re-enabled ${totalChanges} table access calls!`);
    
    log('blue', '\n📋 Next steps:');
    log('yellow', '1. Test: npm run build:clean');
    log('yellow', '2. Verify database connectivity');
    log('yellow', '3. Gradually uncomment remaining tables');
    log('yellow', '4. Remove @ts-nocheck when fully working');

  } catch (error) {
    log('red', `❌ Re-enable failed: ${error.message}`);
    process.exit(1);
  }
}

main(); 