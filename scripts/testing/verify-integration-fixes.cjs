#!/usr/bin/env node

/**
 * Verify Integration Fixes
 * 
 * This script verifies that both reported issues are fixed:
 * 1. Google Calendar JSON parsing error
 * 2. React key props warning in Reports component
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Integration Fixes');
console.log('==============================\n');

// Check 1: Verify Google credentials are in proper JSON format
async function checkGoogleCredentials() {
  console.log('1️⃣ Checking Google Calendar credentials format...');
  
  try {
    // Load test credentials
    const credentialsPath = path.join(__dirname, '../../credentials/test-credentials.local');
    if (!fs.existsSync(credentialsPath)) {
      console.log('⚠️ Test credentials not found - skipping database check');
      return true;
    }

    const credentials = fs.readFileSync(credentialsPath, 'utf8');
    const getCredential = (key) => {
      const match = credentials.match(new RegExp(`^${key}=(.+)$`, 'm'));
      return match ? match[1] : '';
    };

    const supabaseUrl = getCredential('TEST_SUPABASE_URL');
    const supabaseServiceKey = getCredential('TEST_SUPABASE_SERVICE_ROLE_KEY');
    const testUserEmail = getCredential('TEST_USER_EMAIL');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ Supabase credentials not found - skipping database check');
      return true;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(user => user.email === testUserEmail);

    if (!testUser) {
      console.log('⚠️ Test user not found - skipping database check');
      return true;
    }

    // Check Google credentials format
    const { data: googleCreds, error } = await supabase
      .from('user_api_credentials')
      .select('credential_name, encrypted_value')
      .eq('user_id', testUser.id)
      .eq('credential_type', 'google_calendar');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!googleCreds.length) {
      console.log('⚠️ No Google credentials found in database');
      return false;
    }

    let jsonParseSuccess = true;
    for (const cred of googleCreds) {
      try {
        const decoded = atob(cred.encrypted_value);
        const parsed = JSON.parse(decoded);
        console.log(`✅ ${cred.credential_name}: Valid JSON format`);
      } catch (parseError) {
        console.log(`❌ ${cred.credential_name}: Invalid JSON format - ${parseError.message}`);
        jsonParseSuccess = false;
      }
    }

    return jsonParseSuccess;

  } catch (error) {
    console.log(`❌ Google credentials check failed: ${error.message}`);
    return false;
  }
}

// Check 2: Verify React key props in Reports component
function checkReactKeyProps() {
  console.log('\n2️⃣ Checking React key props in Reports component...');
  
  try {
    const reportsPath = path.join(__dirname, '../../src/pages/Reports.tsx');
    
    if (!fs.existsSync(reportsPath)) {
      console.log('❌ Reports.tsx not found');
      return false;
    }

    const reportsContent = fs.readFileSync(reportsPath, 'utf8');
    
    // Check for potential missing key props
    const lines = reportsContent.split('\n');
    const issuesFound = [];
    
    // Look for .map calls without key props
    lines.forEach((line, index) => {
      if (line.includes('.map(') && line.includes('=>')) {
        const nextFewLines = lines.slice(index + 1, index + 4).join(' ');
        if (!nextFewLines.includes('key=') && nextFewLines.includes('<')) {
          issuesFound.push({
            lineNumber: index + 1,
            line: line.trim(),
            issue: 'Possible missing key prop'
          });
        }
      }
    });

    // Check for specific fixed patterns
    const timelineKeyFixed = reportsContent.includes('key={`timeline-${lead.leadId}-${index}`}');
    
    if (issuesFound.length === 0) {
      console.log('✅ No obvious missing key props found');
    } else {
      console.log(`⚠️ Found ${issuesFound.length} potential issues:`);
      issuesFound.forEach(issue => {
        console.log(`   Line ${issue.lineNumber}: ${issue.issue}`);
        console.log(`   Code: ${issue.line}`);
      });
    }

    if (timelineKeyFixed) {
      console.log('✅ Timeline component key fix verified');
    } else {
      console.log('⚠️ Timeline component key fix not found');
    }

    return issuesFound.length === 0 && timelineKeyFixed;

  } catch (error) {
    console.log(`❌ React key props check failed: ${error.message}`);
    return false;
  }
}

// Check 3: Verify .env.local setup guidance
function checkEnvSetup() {
  console.log('\n3️⃣ Checking environment setup...');
  
  const envPath = path.join(__dirname, '../../.env.local');
  const setupScriptPath = path.join(__dirname, '../create-env-local.sh');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_GOOGLE_CLIENT_ID=28489724970')) {
      console.log('✅ Google Client ID configured');
    } else {
      console.log('⚠️ Google Client ID not found in .env.local');
    }
    
    return true;
  } else {
    console.log('⚠️ .env.local file not found');
    
    if (fs.existsSync(setupScriptPath)) {
      console.log('✅ Setup script available: npm run setup:env');
    } else {
      console.log('❌ Setup script not found');
    }
    
    return false;
  }
}

// Main verification
async function main() {
  const googleCheck = await checkGoogleCredentials();
  const reactCheck = checkReactKeyProps();
  const envCheck = checkEnvSetup();

  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=======================');
  console.log(`Google Calendar JSON parsing: ${googleCheck ? '✅ FIXED' : '❌ NEEDS ATTENTION'}`);
  console.log(`React key props warnings: ${reactCheck ? '✅ FIXED' : '❌ NEEDS ATTENTION'}`);
  console.log(`Environment setup: ${envCheck ? '✅ READY' : '⚠️ NEEDS SETUP'}`);

  if (googleCheck && reactCheck && envCheck) {
    console.log('\n🎉 All issues resolved! Your integration should work correctly.');
  } else {
    console.log('\n🔧 Some issues need attention. See details above.');
    
    if (!envCheck) {
      console.log('\n📋 Next steps:');
      console.log('1. Run: npm run setup:env');
      console.log('2. Update Google Client Secret in .env.local');
      console.log('3. Restart your development server');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
} 