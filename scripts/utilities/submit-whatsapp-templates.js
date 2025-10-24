#!/usr/bin/env node

/**
 * WhatsApp Business Template Submission Script
 * Use this to submit your templates to Meta for approval
 *
 * Usage: node scripts/submit-whatsapp-templates.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Your Hebrew Meta-ready templates for Eliana from Qeta
const META_SUBMISSION_TEMPLATES = {
  ELIANA_QETA_INITIAL_CONTACT: {
    name: "eliana_qeta_initial_contact",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nרציתי לבדוק אם זה זמן נוח לשיחה קצרה?",
        example: {
          body_text: [["יוסי"]],
        },
      },
    ],
  },

  ELIANA_QETA_PREVIOUS_CONVERSATION: {
    name: "eliana_qeta_previous_conversation",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nמקווה שאתה זוכר אותי מהשיחה הקודמת שלנו :)",
        example: {
          body_text: [["דוד"]],
        },
      },
    ],
  },

  ELIANA_QETA_IMMEDIATE_OCCUPANCY: {
    name: "eliana_qeta_immediate_occupancy",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nכפי שהבטחתי אני כאן כדי לעדכן בהטבות הנוכחיות,\nאכלוס מיידי ותשלום היתרה בעוד שנה, רוצה לשמוע פרטים נוספים?",
        example: {
          body_text: [["מיכל"]],
        },
      },
    ],
  },

  ELIANA_QETA_PAYMENT_RESET: {
    name: "eliana_qeta_payment_reset",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nרציתי לשתף אותך בהצעה חדשה, אפשרות לאיפוס תשלום לשנה הקרובה, מעוניין לשמוע עוד?",
        example: {
          body_text: [["אבי"]],
        },
      },
    ],
  },

  ELIANA_QETA_PAST_INTEREST: {
    name: "eliana_qeta_past_interest",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nראיתי שהתעניינת בעבר בפרויקט שלנו, נשמח לשתף אותך בעדכון חשוב ובהצעה מותאמת עבורך, רוצה לשמוע עוד?",
        example: {
          body_text: [["רונית"]],
        },
      },
    ],
  },

  ELIANA_QETA_WEEKLY_OFFER_KAPLAN: {
    name: "eliana_qeta_weekly_offer_kaplan",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nרציתי לעדכן אותך שיש לנו הצעה זמינה השבוע, מעניין אותך לשמוע על פרטי הפרויקט בקפלן",
        example: {
          body_text: [["שרון"]],
        },
      },
    ],
  },

  ELIANA_QETA_IMMEDIATE_OCCUPANCY_ALT: {
    name: "eliana_qeta_immediate_occupancy_alt",
    category: "MARKETING",
    language: "he",
    components: [
      {
        type: "BODY",
        text: "היי {{1}}, זו אליאנה מקטה\nרציתי לעדכן אותך על אפשרות לאכלוס מיידי, עם תשלום היתרה בעוד שנה, רוצה לשמוע עוד פרטים?",
        example: {
          body_text: [["עמית"]],
        },
      },
    ],
  },
};

// Configuration - Using hardcoded Meta credentials for template submission
const BUSINESS_ACCOUNT_ID = "509878158869000";
const ACCESS_TOKEN = "EAAOjW2EOihoBOZCo1ZAQkjvHP1x3LJXmJnXc0YH2UtwvqgVYZC20vWfz0Jrp3k3qGPZCI3Y1hBmOV5yI6anIJlJI0fa11i2vvRhZCRsHQMdGKZCcimH8ZBwMT0cjRMRUyEK45QiFk9equnmv6uQZC4A7P8bxYyQZB6EGlioSh7OZCkx2ZCkGWmQ9WpGNz2YRl0WArSt14T6KZAriIZCfNmsFQqmXUwDN4ZAv2Kp3OHpPfXDWA0";
const BASE_URL = "https://graph.facebook.com/v18.0";

async function submitTemplate(template) {
  console.log(`📤 Submitting template: ${template.name}`);

  try {
    const response = await fetch(
      `${BASE_URL}/${BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      },
    );

    const result = await response.json();

    if (response.ok && result.id) {
      console.log(
        `✅ SUCCESS: Template "${template.name}" submitted! ID: ${result.id}`,
      );
      return { success: true, id: result.id, name: template.name };
    } else {
      console.error(
        `❌ FAILED: Template "${template.name}":`,
        result.error?.message || result,
      );
      return {
        success: false,
        name: template.name,
        error: result.error?.message || "Unknown error",
      };
    }
  } catch (error) {
    console.error(
      `💥 ERROR submitting template "${template.name}":`,
      error.message,
    );
    return { success: false, name: template.name, error: error.message };
  }
}

async function submitAllTemplates() {
  console.log("🎯 WHATSAPP BUSINESS TEMPLATE SUBMISSION FOR META APP REVIEW");
  console.log("=".repeat(60));

  // Credentials are hardcoded for template submission
  console.log(`📱 Business Account ID: ${BUSINESS_ACCOUNT_ID}`);
  console.log(`🔑 Access Token: ${ACCESS_TOKEN.substring(0, 20)}...`);

  console.log("📋 Templates to submit:");
  Object.values(META_SUBMISSION_TEMPLATES).forEach((template, index) => {
    console.log(`${index + 1}. ${template.name} (${template.category})`);
  });

  console.log("\n🚀 Starting submission process...\n");

  const results = [];

  for (const template of Object.values(META_SUBMISSION_TEMPLATES)) {
    const result = await submitTemplate(template);
    results.push(result);

    // Wait 1 second between submissions to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log("\n📊 SUBMISSION SUMMARY:");
  console.log("=".repeat(40));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log("\n✅ SUCCESSFULLY SUBMITTED:");
    successful.forEach((result) => {
      console.log(`   - ${result.name} (ID: ${result.id})`);
    });
  }

  if (failed.length > 0) {
    console.log("\n❌ FAILED SUBMISSIONS:");
    failed.forEach((result) => {
      console.log(`   - ${result.name}: ${result.error}`);
    });
  }

  console.log("\n🎉 NEXT STEPS:");
  console.log("1. Check Meta Business Manager for approval status");
  console.log("2. Templates typically take 1-5 business days for approval");
  console.log("3. Once approved, you can use them in your screen recordings");
  console.log(
    "4. Approved templates will show in your WhatsApp Business dashboard",
  );

  console.log("\n📱 Check status at: https://business.facebook.com");
}

async function checkTemplateStatus() {
  console.log("📊 Checking template approval status...");

  try {
    const response = await fetch(
      `${BASE_URL}/${BUSINESS_ACCOUNT_ID}/message_templates?fields=id,name,status,category`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    const result = await response.json();

    if (response.ok && result.data) {
      console.log(
        `\n📋 Found ${result.data.length} templates in your account:\n`,
      );

      result.data.forEach((template) => {
        const statusIcon =
          template.status === "APPROVED"
            ? "✅"
            : template.status === "PENDING"
              ? "⏳"
              : "❌";
        console.log(`${statusIcon} ${template.name} (${template.status})`);
      });
    } else {
      console.error("Failed to fetch templates:", result);
    }
  } catch (error) {
    console.error("Error checking template status:", error);
  }
}

// Command line handling
const command = process.argv[2];

if (command === "status") {
  checkTemplateStatus();
} else if (command === "help") {
  console.log("WhatsApp Template Submission Tool");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node scripts/submit-whatsapp-templates.js        # Submit all templates",
  );
  console.log(
    "  node scripts/submit-whatsapp-templates.js status # Check template status",
  );
  console.log(
    "  node scripts/submit-whatsapp-templates.js help   # Show this help",
  );
} else {
  submitAllTemplates();
}
