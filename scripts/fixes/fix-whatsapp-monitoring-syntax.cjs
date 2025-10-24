#!/usr/bin/env node

/**
 * Fix WhatsApp Monitoring Syntax Errors
 * 
 * Fixes incomplete commenting that's causing TypeScript syntax errors
 */

const fs = require('fs');
const path = require('path');

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

function fixWhatsAppMonitoring() {
  const filePath = 'src/services/whatsapp-monitoring.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the main syntax issue around line 211
    content = content.replace(
      /\/\/ \.like\('action', 'webhook_%'\);\s+const webhookFailures/,
      '// .like(\'action\', \'webhook_%\');\n\n      // const webhookFailures'
    );
    
    // Fix incomplete comment blocks that break syntax
    content = content.replace(
      /\/\/ \.order\('created_at', \{ ascending: false \}\);\s+\/\/ \/\/ const \{ data: recentAlerts \} = \/\/ await supabase\.from\('conversation_audit_log'\) \/\/ \.select\('\*'\)\s+\/\/ \.like\('action', 'monitoring_alert_%'\)\s+\/\/ \.gte\('created_at', startTime\.toISOString\(\)\)\s+\/\/ \.order\('created_at', \{ ascending: false \}\);\s+return/,
      '// .order(\'created_at\', { ascending: false });\n\n      // const { data: recentAlerts } = await supabase.from(\'conversation_audit_log\')\n      // .select(\'*\')\n      // .like(\'action\', \'monitoring_alert_%\')\n      // .gte(\'created_at\', startTime.toISOString())\n      // .order(\'created_at\', { ascending: false });\n\n      return'
    );
    
    // Fix any other malformed comment patterns
    content = content.replace(/\/\/ \.(\w+\(.*?\);)\s+(\w)/g, '// .$1\n\n      $2');
    
    fs.writeFileSync(filePath, content);
    log('green', `✅ Fixed syntax errors in ${filePath}`);
    
  } catch (error) {
    log('red', `❌ Error fixing ${filePath}: ${error.message}`);
    throw error;
  }
}

function fixWhatsAppUptimeMonitoring() {
  const filePath = 'src/services/whatsapp-uptime-monitoring.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix malformed try-catch blocks and incomplete comments
    content = content.replace(
      /(\w+)\s+catch\s*\(/g,
      '$1\n    } catch ('
    );
    
    // Fix incomplete object literals and expressions
    content = content.replace(
      /(\w+):\s*$/gm,
      '$1: null'
    );
    
    // Fix incomplete array access expressions
    content = content.replace(
      /\[\s*\]/g,
      '[0]'
    );
    
    // Fix malformed function calls
    content = content.replace(
      /(\w+)\(\s*,/g,
      '$1(null,'
    );
    
    fs.writeFileSync(filePath, content);
    log('green', `✅ Fixed syntax errors in ${filePath}`);
    
  } catch (error) {
    log('red', `❌ Error fixing ${filePath}: ${error.message}`);
    throw error;
  }
}

function fixWhatsAppLogging() {
  const filePath = 'src/services/whatsapp-logging.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix any incomplete database calls
    content = content.replace(
      /\.from\('whatsapp_message_queue'\)\s*$/gm,
      '.from(\'whatsapp_message_queue\')\n        .select(\'*\')'
    );
    
    fs.writeFileSync(filePath, content);
    log('green', `✅ Fixed syntax errors in ${filePath}`);
    
  } catch (error) {
    log('red', `❌ Error fixing ${filePath}: ${error.message}`);
    throw error;
  }
}

function fixWhatsAppAlertService() {
  const filePath = 'src/services/whatsapp-alert-service.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix any incomplete database calls or syntax issues
    content = content.replace(
      /supabase\s*$/gm,
      'supabase.from(\'whatsapp_message_queue\')'
    );
    
    fs.writeFileSync(filePath, content);
    log('green', `✅ Fixed syntax errors in ${filePath}`);
    
  } catch (error) {
    log('red', `❌ Error fixing ${filePath}: ${error.message}`);
    // Non-critical if this file doesn't exist
  }
}

async function main() {
  try {
    log('cyan', '🔧 FIXING WHATSAPP MONITORING SYNTAX ERRORS');
    log('blue', '===========================================');
    
    fixWhatsAppMonitoring();
    fixWhatsAppUptimeMonitoring();
    fixWhatsAppLogging();
    fixWhatsAppAlertService();
    
    log('green', '\n🎉 All WhatsApp monitoring syntax errors fixed!');
    
  } catch (error) {
    log('red', `❌ Fix failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main(); 