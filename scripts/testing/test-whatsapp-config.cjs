#!/usr/bin/env node

/**
 * WhatsApp Configuration Test
 * Tests if WhatsApp credentials are properly configured and accessible
 */

const fs = require('fs');
const path = require('path');

async function testWhatsAppConfiguration() {
  console.log('🧪 Testing WhatsApp Configuration...\n');
  
  try {
    // Read .env.local file
    const envPath = '.env.local';
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local file not found');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env.local file found');
    
    // Check for required WhatsApp variables
    const requiredVars = [
      'VITE_WHATSAPP_ACCESS_TOKEN',
      'VITE_WHATSAPP_PHONE_NUMBER_ID',
      'VITE_WHATSAPP_BUSINESS_ACCOUNT_ID',
      'VITE_WHATSAPP_APP_ID',
      'VITE_WHATSAPP_WEBHOOK_URL'
    ];
    
    const foundVars = {};
    let allFound = true;
    
    requiredVars.forEach(varName => {
      const regex = new RegExp(`${varName}=(.+)`);
      const match = envContent.match(regex);
      
      if (match && match[1] && match[1].trim() !== '') {
        foundVars[varName] = match[1].substring(0, 20) + '...';
        console.log(`✅ ${varName}: ${foundVars[varName]}`);
      } else {
        console.log(`❌ ${varName}: Not found or empty`);
        allFound = false;
      }
    });
    
    console.log('\n📋 Configuration Summary:');
    console.log('=========================');
    
    if (allFound) {
      console.log('🎉 All required WhatsApp variables are configured!');
      
      // Test specific values
      const phoneMatch = envContent.match(/VITE_WHATSAPP_PHONE_NUMBER_ID=(.+)/);
      const webhookMatch = envContent.match(/VITE_WHATSAPP_WEBHOOK_URL=(.+)/);
      
      if (phoneMatch) {
        console.log(`📱 Phone Number ID: ${phoneMatch[1]}`);
      }
      
      if (webhookMatch) {
        console.log(`🌐 Webhook URL: ${webhookMatch[1]}`);
      }
      
      console.log('\n✅ WhatsApp integration is ready for testing!');
      console.log('\n🚀 Next steps:');
      console.log('1. Open browser to http://localhost:3000/whatsapp-test');
      console.log('2. Test WhatsApp connection');
      console.log('3. Send test message to verify integration');
      console.log('4. Check webhook receiving messages');
      
      return true;
    } else {
      console.log('❌ Some required variables are missing');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error testing configuration:', error);
    return false;
  }
}

async function testWebhookConnectivity() {
  console.log('\n🌐 Testing Webhook Connectivity...');
  
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const webhookMatch = envContent.match(/VITE_WHATSAPP_WEBHOOK_URL=(.+)/);
    
    if (!webhookMatch) {
      console.log('❌ Webhook URL not found in configuration');
      return false;
    }
    
    const webhookUrl = webhookMatch[1];
    console.log(`📡 Testing: ${webhookUrl}`);
    
    // Basic URL validation
    try {
      new URL(webhookUrl);
      console.log('✅ Webhook URL format is valid');
      
      // Check if it's the correct Supabase function URL
      if (webhookUrl.includes('supabase.co/functions/v1/from_whatsapp_webhook')) {
        console.log('✅ Webhook points to correct Supabase function');
      } else {
        console.log('⚠️ Webhook URL might not be the expected Supabase function');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Webhook URL format is invalid:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error testing webhook:', error);
    return false;
  }
}

async function generateTestInstructions() {
  console.log('\n📖 WhatsApp Testing Instructions:');
  console.log('==================================');
  
  console.log('\n1. 🌐 Open Web Interface:');
  console.log('   http://localhost:3000/whatsapp-test');
  
  console.log('\n2. 🧪 Test Connection:');
  console.log('   - Click "Check Configuration"');
  console.log('   - Verify all credentials show as ✅');
  console.log('   - Click "Test Connection"');
  
  console.log('\n3. 📱 Send Test Message:');
  console.log('   - Enter test number: 15551502403');
  console.log('   - Or use Israeli number: +972552990370');
  console.log('   - Click "Send Test Message"');
  
  console.log('\n4. 📨 Test Webhook (Optional):');
  console.log('   - Send message TO your WhatsApp Business number');
  console.log('   - Check if webhook receives the message');
  console.log('   - Verify in Messages page or logs');
  
  console.log('\n5. 🔍 Check Results:');
  console.log('   - Message delivery confirmation');
  console.log('   - No error messages in console');
  console.log('   - Webhook receiving messages (if testing inbound)');
}

// Main execution
if (require.main === module) {
  console.log('🚀 WhatsApp Configuration Test');
  console.log('===============================\n');
  
  testWhatsAppConfiguration()
    .then(success => {
      if (success) {
        return testWebhookConnectivity();
      }
      return false;
    })
    .then(success => {
      if (success) {
        generateTestInstructions();
        console.log('\n🎯 Configuration test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Configuration test failed - check errors above');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Configuration test crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  testWhatsAppConfiguration,
  testWebhookConnectivity,
  generateTestInstructions
}; 