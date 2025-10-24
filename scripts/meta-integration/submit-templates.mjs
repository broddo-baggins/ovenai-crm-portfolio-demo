#!/usr/bin/env node

/**
 * WhatsApp Business Template Submission Script (ES Module Version)
 * Submit all 5 utility templates to Meta for approval
 * 
 * Usage: node scripts/submit-templates.mjs
 */

import { config } from 'dotenv';
config();

// Your WhatsApp Business API Credentials
const WHATSAPP_CONFIG = {
  ACCESS_TOKEN: "EAAOjW2EOihoBOZCo1ZAQkjvHP1x3LJXmJnXc0YH2UtwvqgVYZC20vWfz0Jrp3k3qGPZCI3Y1hBmOV5yI6anIJlJI0fa11i2vvRhZCRsHQMdGKZCcimH8ZBwMT0cjRMRUyEK45QiFk9equnmv6uQZC4A7P8bxYyQZB6EGlioSh7OZCkx2ZCkGWmQ9WpGNz2YRl0WArSt14T6KZAriIZCfNmsFQqmXUwDN4ZAv2Kp3OHpPfXDWA0",
  PHONE_NUMBER_ID: "516328811554542",
  BUSINESS_ACCOUNT_ID: "509878158869000",
  PHONE_NUMBER: "15551502403",
  USER_ID: "61576418486283",
  WEBHOOK_URL: "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/from_whatsapp_webhook"
};

// Your 5 Meta-ready templates for immediate submission
const META_SUBMISSION_TEMPLATES = {
  PROPERTY_INQUIRY_RESPONSE: {
    name: "property_inquiry_confirmation",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Thanks for your interest in {{1}}. We'll contact you within 24 hours to discuss details and schedule a viewing.",
        example: {
          body_text: [["Luxury Waterfront Condo"]],
        },
      },
    ],
  },

  VIEWING_CONFIRMATION: {
    name: "viewing_confirmation",
    category: "UTILITY", 
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Your property viewing for {{1}} is confirmed for {{2}}. Address: {{3}}. Please reply if you need to reschedule.",
        example: {
          body_text: [["Downtown Apartment", "Tuesday 3:00 PM", "123 Main St"]],
        },
      },
    ],
  },

  CONTACT_INFORMATION: {
    name: "contact_information_share",
    category: "UTILITY",
    language: "en_US", 
    components: [
      {
        type: "BODY",
        text: "Here's the contact information you requested:\\n\\nAgent: {{1}}\\nPhone: {{2}}\\nEmail: {{3}}\\n\\nFeel free to reach out anytime!",
        example: {
          body_text: [["Sarah Johnson", "(555) 123-4567", "sarah@realestate.com"]],
        },
      },
    ],
  },

  MEETING_REMINDER: {
    name: "meeting_reminder",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY", 
        text: "Reminder: Your meeting regarding {{1}} is scheduled for {{2}}. Looking forward to speaking with you!",
        example: {
          body_text: [["Real Estate Investment", "Tomorrow at 2:00 PM"]],
        },
      },
    ],
  },

  FOLLOW_UP_MESSAGE: {
    name: "follow_up_message",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, following up on our discussion about {{2}}. Do you have any questions or would you like to schedule a follow-up meeting?",
        example: {
          body_text: [["John", "property investment opportunities"]],
        },
      },
    ],
  },
};

/**
 * Submit a template to WhatsApp Business API
 */
async function submitTemplate(templateName, templateData) {
  try {
    console.log(`🚀 Submitting template: ${templateName}...`);

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${WHATSAPP_CONFIG.BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Template "${templateName}" submitted successfully!`);
      console.log(`   Template ID: ${result.id}`);
      console.log(`   Status: ${result.status || 'PENDING_REVIEW'}`);
      return { success: true, id: result.id, name: templateName };
    } else {
      console.log(`❌ Failed to submit "${templateName}":`, result.error?.message || result);
      return { success: false, error: result.error?.message || 'Unknown error', name: templateName };
    }
  } catch (error) {
    console.log(`💥 Error submitting "${templateName}":`, error.message);
    return { success: false, error: error.message, name: templateName };
  }
}

/**
 * Submit all templates to Meta
 */
async function submitAllTemplates() {
  console.log('🎯 WhatsApp Business Template Submission');
  console.log('=' .repeat(60));
  console.log(`📱 Phone Number: ${WHATSAPP_CONFIG.PHONE_NUMBER}`);
  console.log(`🏢 Business Account: ${WHATSAPP_CONFIG.BUSINESS_ACCOUNT_ID}`);
  console.log(`📞 Phone Number ID: ${WHATSAPP_CONFIG.PHONE_NUMBER_ID}`);
  console.log(`👤 User ID: ${WHATSAPP_CONFIG.USER_ID}`);
  console.log('=' .repeat(60));

  const results = [];

  // Submit each template
  for (const [templateKey, templateData] of Object.entries(META_SUBMISSION_TEMPLATES)) {
    const result = await submitTemplate(templateKey, templateData);
    results.push(result);
    
    // Wait 2 seconds between submissions to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary report
  console.log('\n📊 SUBMISSION SUMMARY');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully submitted: ${successful.length}/${results.length} templates`);
  console.log(`❌ Failed submissions: ${failed.length}/${results.length} templates`);

  if (successful.length > 0) {
    console.log('\n🎉 Successful Submissions:');
    successful.forEach(r => {
      console.log(`   ✅ ${r.name} (ID: ${r.id})`);
    });
  }

  if (failed.length > 0) {
    console.log('\n⚠️ Failed Submissions:');
    failed.forEach(r => {
      console.log(`   ❌ ${r.name}: ${r.error}`);
    });
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Templates will be reviewed by Meta (2-5 business days)');
  console.log('2. Check template status in Meta Business Manager');
  console.log('3. Once approved, templates can be used in production');
  console.log('4. Prepare screen recordings for Meta App Review');
  console.log('\n🚀 Meta App Review Progress: 95% Complete!');
}

// Run the submission
submitAllTemplates().catch(console.error); 